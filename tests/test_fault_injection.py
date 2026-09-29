import pytest
import sys
import os
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.hardware.controller_adapter import motor_controller
from app.policy.engine import DeterministicPolicyEngine
from app.policy.state_machine import EquipmentState, LatchReason

@pytest.mark.asyncio
async def test_stale_telemetry_fault_injection():
    # Configure policy with 1.0 second timeout for test
    policy = DeterministicPolicyEngine(stale_data_timeout_sec=0.5)
    policy.update_telemetry_time("asset_stale_test")
    
    # Wait for timeout to expire
    time.sleep(0.6)
    
    mock_inf = {"score_normal": 0.95, "score_mild": 0.03, "score_strong": 0.02}
    decision = policy.evaluate("asset_stale_test", mock_inf, EquipmentState.RUNNING, LatchReason.NONE)
    
    # Stale data MUST result in STOP and DATA_FAULT latch!
    assert decision.action == "STOP"
    assert decision.latch_state == "DATA_FAULT"
    assert "STALE_DATA" in decision.reason

@pytest.mark.asyncio
async def test_manual_emergency_cut_and_auto_restart_prevention():
    # 1. Trigger emergency stop
    await motor_controller.emergency_cut()
    health = await motor_controller.get_health()
    assert health["tripped"] is True
    assert health["status"] == "FAULT"
    assert health["measured_rpm"] == 0

    # 2. Attempt to restart while tripped (MUST BE REJECTED)
    restart_attempt = await motor_controller.set_speed(1800)
    assert restart_attempt is False
    assert (await motor_controller.get_measured_rpm()) == 0

    # 3. Clean up by executing explicit reset
    await motor_controller.reset_hardware_trip()
    health_after = await motor_controller.get_health()
    assert health_after["tripped"] is False

def test_model_uncertainty_fallback():
    policy = DeterministicPolicyEngine(strong_threshold=0.85, mild_threshold=0.80, normal_threshold=0.90)
    policy.update_telemetry_time("asset_uncertain")
    
    # No class reaches threshold
    uncertain_inf = {"score_normal": 0.40, "score_mild": 0.35, "score_strong": 0.25}
    decision = policy.evaluate("asset_uncertain", uncertain_inf, EquipmentState.RUNNING, LatchReason.NONE)
    
    assert decision.action == "STOP"
    assert decision.latch_state == "INSPECTION_REQUIRED"
    assert "MODEL_UNCERTAIN" in decision.reason
