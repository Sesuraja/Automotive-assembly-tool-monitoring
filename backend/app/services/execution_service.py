import asyncio
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.telemetry import Telemetry, Run
from app.models.operations import Asset, Station
from app.models.ml import FeatureRecord, Inference
from app.models.policy import Decision
from app.models.audit import EventTrace
from app.hardware.ble_adapter import ble_adapter
from app.hardware.controller_adapter import motor_controller
from app.ml.features import feature_extractor
from app.ml.registry import model_registry
from app.policy.engine import policy_engine
from app.policy.state_machine import EquipmentState, LatchReason
from app.services.command_service import command_service
from app.services.fault_service import fault_service
from app.services.websocket_manager import ws_manager

class ExecutionService:
    """
    Execution Layer Orchestrator conforming to PRD pipeline:
    BLE Sensor/Controller API -> BLE Adapter -> Normalized Telemetry -> Window Buffer
    -> Feature Extraction -> ML Inference -> Deterministic Decision Policy
    -> Command Service -> Motor Controller -> RPM/Health Feedback
    -> Event Store -> WebSocket -> Dashboard.
    """
    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._current_run_id: Optional[str] = None
        self._latest_state: Dict[str, Any] = {}

    def get_latest_state(self, asset_id: Optional[str] = None) -> Dict[str, Any]:
        return self._latest_state

    async def start_pipeline(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._pipeline_loop())

    async def stop_pipeline(self):
        self._running = False
        if self._task:
            self._task.cancel()

    async def _pipeline_loop(self):
        """
        Continuous ingestion & inference loop (runs every ~500ms to 1s)
        """
        while self._running:
            db = SessionLocal()
            try:
                await self._process_cycle(db)
            except Exception as e:
                print(f"[ExecutionService Error] {e}")
            finally:
                db.close()
            await asyncio.sleep(1.0)

    async def _process_cycle(self, db: Session):
        # Find active asset
        asset = db.query(Asset).first()
        if not asset:
            return

        company_id = asset.company_id
        asset_id = asset.id
        station_id = asset.station_id

        # 1. Acquire raw data through Hardware Adapter Boundary
        sensor_data = await ble_adapter.read_telemetry("ble_node_01")
        if not sensor_data:
            return

        measured_rpm = await motor_controller.get_measured_rpm()
        commanded_rpm = motor_controller._commanded_rpm
        policy_engine.update_telemetry_time(asset_id)

        # 2. Normalize telemetry
        now = datetime.now(timezone.utc)
        telemetry_record = Telemetry(
            company_id=company_id,
            asset_id=asset_id,
            sensor_id="ble_node_01",
            run_id=self._get_or_create_run(db, asset_id, station_id),
            sequence=sensor_data["sequence"],
            timestamp_utc=sensor_data["timestamp_utc"],
            received_at_utc=now,
            accel_x=sensor_data["accel_x"],
            accel_y=sensor_data["accel_y"],
            accel_z=sensor_data["accel_z"],
            motor_rpm=measured_rpm,
            commanded_rpm=commanded_rpm,
            health=sensor_data["health"],
            data_age_ms=sensor_data["data_age_ms"]
        )
        db.add(telemetry_record)
        db.commit()
        db.refresh(telemetry_record)

        # 3. Buffer & Feature Extraction
        feature_extractor.push_sample(
            sensor_data["accel_x"],
            sensor_data["accel_y"],
            sensor_data["accel_z"]
        )
        features = feature_extractor.compute_features(measured_rpm)

        feat_record = FeatureRecord(
            company_id=company_id,
            asset_id=asset_id,
            run_id=telemetry_record.run_id,
            timestamp_utc=now,
            rms=features["rms"],
            peak=features["peak"],
            crest_factor=features["crest_factor"],
            kurtosis=features["kurtosis"],
            band_energy_low=features["band_energy_low"],
            band_energy_mid=features["band_energy_mid"],
            band_energy_high=features["band_energy_high"],
            measured_motor_speed=float(measured_rpm)
        )
        db.add(feat_record)
        db.commit()

        # 4. ML Model Inference
        active_ml = model_registry.get_active_model()
        inference_result = active_ml.predict_features(features)

        inf_record = Inference(
            company_id=company_id,
            asset_id=asset_id,
            run_id=telemetry_record.run_id,
            model_version=inference_result["model_version"],
            timestamp_utc=now,
            score_normal=inference_result["score_normal"],
            score_mild=inference_result["score_mild"],
            score_strong=inference_result["score_strong"],
            predicted_class=inference_result["predicted_class"],
            confidence=inference_result["confidence"]
        )
        db.add(inf_record)
        db.commit()
        db.refresh(inf_record)

        # 5. Deterministic Policy Evaluation
        curr_state = EquipmentState(asset.current_state) if asset.current_state in [e.value for e in EquipmentState] else EquipmentState.READY
        curr_latch = LatchReason(asset.active_latch) if asset.active_latch in [l.value for l in LatchReason] else LatchReason.NONE

        decision = policy_engine.evaluate(
            asset_id=asset_id,
            inference=inference_result,
            current_state=curr_state,
            active_latch=curr_latch
        )

        dec_record = Decision(
            company_id=company_id,
            asset_id=asset_id,
            inference_id=inf_record.id,
            timestamp_utc=now,
            action=decision.action,
            reason=decision.reason,
            persistence_count=decision.persistence_count,
            persistence_threshold=decision.persistence_threshold,
            latch_state=decision.latch_state
        )
        db.add(dec_record)
        db.commit()
        db.refresh(dec_record)

        # 6. Command Execution & Hardware Feedback
        executed_cmd = None
        executed_fb = None

        if decision.action == "STOP" and curr_state not in [EquipmentState.LATCHED_STOP, EquipmentState.FAULT]:
            asset.current_state = "LATCHED_STOP"
            asset.active_latch = decision.latch_state
            db.commit()

            # Record fault
            fault_service.create_fault(
                db=db,
                company_id=company_id,
                asset_id=asset_id,
                category=decision.latch_state if decision.latch_state != "NONE" else "INSPECTION_REQUIRED",
                reason=decision.reason,
                is_latched=True
            )

            executed_cmd, executed_fb = await command_service.execute_command(
                db=db,
                company_id=company_id,
                asset_id=asset_id,
                command_type="STOP",
                target_rpm=0,
                reason=decision.reason,
                decision_id=dec_record.id,
                model_version=inference_result["model_version"]
            )

        elif decision.action == "REDUCE_SPEED" and curr_state != EquipmentState.LATCHED_STOP:
            if asset.current_state != "RUNNING_REDUCED":
                asset.current_state = "RUNNING_REDUCED"
                db.commit()

            if commanded_rpm != decision.target_rpm:
                executed_cmd, executed_fb = await command_service.execute_command(
                    db=db,
                    company_id=company_id,
                    asset_id=asset_id,
                    command_type="SET_SPEED",
                    target_rpm=decision.target_rpm,
                    reason=decision.reason,
                    decision_id=dec_record.id,
                    model_version=inference_result["model_version"]
                )

        elif decision.action == "CONTINUE" and curr_state not in [EquipmentState.LATCHED_STOP, EquipmentState.FAULT]:
            if asset.current_state != "RUNNING":
                asset.current_state = "RUNNING"
                db.commit()

        # 7. Traceability Chain Recording
        trace_id = f"tr_{int(time.time() * 1000)}"
        trace = EventTrace(
            trace_id=trace_id,
            company_id=company_id,
            asset_id=asset_id,
            sensor_event_id=f"seq_{telemetry_record.sequence}",
            telemetry_id=telemetry_record.id,
            inference_id=inf_record.id,
            decision_id=dec_record.id,
            command_id=executed_cmd.id if executed_cmd else None,
            feedback_id=executed_fb.id if executed_fb else None,
            physical_result_rpm=measured_rpm,
            timestamp_utc=now,
            duration_ms=round((time.time() - now.timestamp()) * 1000, 2),
            summary=f"{decision.action} ({decision.reason}) -> Motor: {measured_rpm} RPM",
            trace_payload={
                "features": features,
                "inference": inference_result,
                "decision": decision.to_dict()
            }
        )
        db.add(trace)
        db.commit()

        # 8. Real-time WebSocket Broadcast
        live_payload = {
            "type": "LIVE_TELEMETRY",
            "asset_id": asset_id,
            "asset_name": asset.name,
            "station_id": station_id,
            "connection_status": "CONNECTED",
            "sensor_health": sensor_data["health"],
            "data_age_ms": sensor_data["data_age_ms"],
            "telemetry": {
                "sequence": telemetry_record.sequence,
                "accel_x": telemetry_record.accel_x,
                "accel_y": telemetry_record.accel_y,
                "accel_z": telemetry_record.accel_z,
                "motor_rpm": measured_rpm,
                "commanded_rpm": motor_controller._commanded_rpm
            },
            "features": features,
            "ai": inference_result,
            "decision": decision.to_dict(),
            "command": {
                "command_id": executed_cmd.command_id if executed_cmd else None,
                "target_rpm": decision.target_rpm,
                "controller_status": "FAULT" if asset.current_state in ["LATCHED_STOP", "FAULT"] else "RUNNING",
                "measured_rpm": measured_rpm,
                "status": executed_cmd.status if executed_cmd else "IDLE"
            },
            "state": {
                "current_state": asset.current_state,
                "active_latch": asset.active_latch,
                "reset_required": asset.current_state in ["LATCHED_STOP", "FAULT"]
            },
            "timestamp": now.isoformat()
        }

        self._latest_state = live_payload
        await ws_manager.broadcast_to_company(company_id, live_payload)

    def _get_or_create_run(self, db: Session, asset_id: str, station_id: str) -> str:
        if self._current_run_id:
            return self._current_run_id
        
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        run = Run(
            company_id=asset.company_id if asset else "comp_default",
            asset_id=asset_id,
            station_id=station_id,
            run_number=f"run_{int(time.time())}",
            status="RUNNING"
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        self._current_run_id = run.id
        return run.id

execution_service = ExecutionService()
