import pytest
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.core.permissions import has_permission, Permission
from app.ml.features import FeatureExtractor
from app.ml.engine import VibrationMLEngine
from app.policy.engine import DeterministicPolicyEngine
from app.policy.state_machine import SafetyStateMachine, EquipmentState, LatchReason

def test_rbac_permissions():
    user_perms = {Permission.DEVICES_VIEW.value, Permission.COMMANDS_CREATE.value}
    assert has_permission(user_perms, Permission.DEVICES_VIEW.value) is True
    assert has_permission(user_perms, Permission.COMPANY_DELETE.value) is False
    # Super admin wildcard check
    assert has_permission({"*"}, Permission.COMPANY_DELETE.value) is True

def test_feature_extraction():
    extractor = FeatureExtractor(sampling_rate_hz=100)
    for i in range(50):
        extractor.push_sample(0.1, 0.05, 1.02)
    features = extractor.compute_features(measured_rpm=1800)
    assert "rms" in features
    assert "peak" in features
    assert "crest_factor" in features
    assert "kurtosis" in features
    assert features["measured_motor_speed"] == 1800.0

def test_ml_inference():
    engine = VibrationMLEngine()
    mock_features = {
        "rms": 0.08,
        "peak": 0.22,
        "crest_factor": 2.75,
        "kurtosis": 2.9,
        "band_energy_low": 0.1,
        "band_energy_mid": 0.05,
        "band_energy_high": 0.02,
        "measured_motor_speed": 1800.0
    }
    pred = engine.predict_features(mock_features)
    assert pred["predicted_class"] in ["NORMAL", "MILD_DISTURBANCE", "STRONG_DISTURBANCE"]
    assert 0.0 <= pred["confidence"] <= 1.0

def test_deterministic_policy_persistence():
    policy = DeterministicPolicyEngine(strong_threshold=0.85, strong_persistence_windows=2)
    # Window 1: High strong score
    inf1 = {"score_strong": 0.92, "score_mild": 0.05, "score_normal": 0.03}
    policy.update_telemetry_time("asset_1")
    dec1 = policy.evaluate("asset_1", inf1, EquipmentState.RUNNING, LatchReason.NONE)
    assert dec1.action == "CONTINUE" # Needs 2 windows persistence!
    assert dec1.persistence_count == 1

    # Window 2: High strong score persists -> Trigger STOP + INSPECTION_REQUIRED
    dec2 = policy.evaluate("asset_1", inf1, EquipmentState.RUNNING, LatchReason.NONE)
    assert dec2.action == "STOP"
    assert dec2.latch_state == "INSPECTION_REQUIRED"
    assert dec2.reset_required is True

def test_safety_state_machine_latched_stop_requires_operator_reset():
    sm = SafetyStateMachine(EquipmentState.READY)
    assert sm.state == EquipmentState.READY

    sm.trigger_latched_stop(LatchReason.INSPECTION_REQUIRED, "Strong vibration trip")
    assert sm.state == EquipmentState.LATCHED_STOP

    # Automatic transition must be blocked!
    assert sm.can_transition_to(EquipmentState.RUNNING) is False
    assert sm.transition(EquipmentState.RUNNING) is False

    # Explicit operator reset
    ok, msg = sm.operator_reset("operator@plant.com", "Tool inspected and mechanical clamp adjusted.")
    assert ok is True
    assert sm.state == EquipmentState.READY
