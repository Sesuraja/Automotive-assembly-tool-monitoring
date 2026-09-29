import pytest
import sys
import os
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database.session import SessionLocal
from app.models.operations import Asset
from app.models.company import Company
from app.hardware.ble_adapter import ble_adapter
from app.hardware.controller_adapter import motor_controller
from app.ml.features import feature_extractor
from app.ml.engine import ml_engine
from app.policy.engine import policy_engine
from app.policy.state_machine import EquipmentState, LatchReason
from app.services.command_service import command_service

@pytest.mark.asyncio
async def test_full_pipeline_event_chain():
    db = SessionLocal()
    try:
        asset = db.query(Asset).first()
        company = db.query(Company).first()
        assert asset is not None
        assert company is not None

        # 1. Acquire telemetry via BLE adapter
        sensor_data = await ble_adapter.read_telemetry("ble_node_01")
        assert sensor_data is not None
        assert "accel_z" in sensor_data

        # 2. Extract features
        feature_extractor.push_sample(sensor_data["accel_x"], sensor_data["accel_y"], sensor_data["accel_z"])
        measured_rpm = await motor_controller.get_measured_rpm()
        features = feature_extractor.compute_features(measured_rpm)
        assert features["rms"] >= 0.0

        # 3. ML Inference
        pred = ml_engine.predict_features(features)
        assert pred["predicted_class"] in ["NORMAL", "MILD_DISTURBANCE", "STRONG_DISTURBANCE"]

        # 4. Policy Decision
        policy_engine.update_telemetry_time(asset.id)
        decision = policy_engine.evaluate(asset.id, pred, EquipmentState.READY, LatchReason.NONE)
        assert decision.action in ["CONTINUE", "REDUCE_SPEED", "STOP"]

        # 5. Command Service execution
        cmd, fb = await command_service.execute_command(
            db=db,
            company_id=company.id,
            asset_id=asset.id,
            command_type="SET_SPEED",
            target_rpm=decision.target_rpm,
            reason="Integration test pipeline verification"
        )
        assert cmd.status == "COMPLETE"
        assert fb.status == "COMPLETE"
        assert fb.measured_rpm >= 0
    finally:
        db.close()
