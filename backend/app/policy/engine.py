import time
from typing import Dict, Any, Optional, Tuple
from app.policy.state_machine import EquipmentState, LatchReason, SafetyStateMachine

class PolicyDecisionResult:
    def __init__(
        self,
        action: str, # CONTINUE, REDUCE_SPEED, STOP, FAULT
        reason: str,
        persistence_count: int,
        persistence_threshold: int,
        target_rpm: int,
        latch_state: str = "NONE",
        reset_required: bool = False
    ):
        self.action = action
        self.reason = reason
        self.persistence_count = persistence_count
        self.persistence_threshold = persistence_threshold
        self.target_rpm = target_rpm
        self.latch_state = latch_state
        self.reset_required = reset_required

    def to_dict(self) -> Dict[str, Any]:
        return {
            "action": self.action,
            "reason": self.reason,
            "persistence_count": self.persistence_count,
            "persistence_threshold": self.persistence_threshold,
            "target_rpm": self.target_rpm,
            "latch_state": self.latch_state,
            "reset_required": self.reset_required
        }

class DeterministicPolicyEngine:
    """
    Deterministic Equipment Decision Policy Engine.
    STRICT SEPARATION OF CONCERNS:
    1. ML Model predicts condition probabilities.
    2. Policy evaluates thresholds, persistence windows, staleness, and equipment state.
    3. Controller executes approved command and enforces physical limits.
    """
    def __init__(
        self,
        strong_threshold: float = 0.85,
        strong_persistence_windows: int = 2,
        mild_threshold: float = 0.80,
        mild_persistence_windows: int = 3,
        normal_threshold: float = 0.90,
        stale_data_timeout_sec: float = 3.0,
        nominal_rpm: int = 1800,
        reduced_speed_ratio: float = 0.50
    ):
        self.strong_threshold = strong_threshold
        self.strong_persistence = strong_persistence_windows
        self.mild_threshold = mild_threshold
        self.mild_persistence = mild_persistence_windows
        self.normal_threshold = normal_threshold
        self.stale_timeout = stale_data_timeout_sec
        self.nominal_rpm = nominal_rpm
        self.reduced_rpm = int(nominal_rpm * reduced_speed_ratio)

        # Track window persistence per asset
        self._strong_counts: Dict[str, int] = {}
        self._mild_counts: Dict[str, int] = {}
        self._last_telemetry_timestamps: Dict[str, float] = {}

    def update_telemetry_time(self, asset_id: str) -> None:
        self._last_telemetry_timestamps[asset_id] = time.time()

    def evaluate(
        self,
        asset_id: str,
        inference: Dict[str, Any],
        current_state: EquipmentState,
        active_latch: LatchReason
    ) -> PolicyDecisionResult:
        # Check staleness: if telemetry older than stale timeout, trigger STOP + DATA_FAULT
        now = time.time()
        last_t = self._last_telemetry_timestamps.get(asset_id, now)
        if (now - last_t) > self.stale_timeout:
            return PolicyDecisionResult(
                action="STOP",
                reason="STALE_DATA_TIMEOUT (> 3s without packet)",
                persistence_count=1,
                persistence_threshold=1,
                target_rpm=0,
                latch_state=LatchReason.DATA_FAULT.value,
                reset_required=True
            )

        # If currently latched, MUST NOT automatically resume
        if current_state in [EquipmentState.LATCHED_STOP, EquipmentState.FAULT]:
            return PolicyDecisionResult(
                action="STOP",
                reason=f"Station currently in {current_state.value} ({active_latch.value}). Operator reset required.",
                persistence_count=0,
                persistence_threshold=1,
                target_rpm=0,
                latch_state=active_latch.value,
                reset_required=True
            )

        score_strong = inference.get("score_strong", 0.0)
        score_mild = inference.get("score_mild", 0.0)
        score_normal = inference.get("score_normal", 0.0)

        # 1. Strong Disturbance Check (STOP + Latch INSPECTION_REQUIRED)
        if score_strong >= self.strong_threshold:
            cnt = self._strong_counts.get(asset_id, 0) + 1
            self._strong_counts[asset_id] = cnt
            self._mild_counts[asset_id] = 0

            if cnt >= self.strong_persistence:
                return PolicyDecisionResult(
                    action="STOP",
                    reason="STRONG_VIBRATION (score >= 0.85 persistent)",
                    persistence_count=cnt,
                    persistence_threshold=self.strong_persistence,
                    target_rpm=0,
                    latch_state=LatchReason.INSPECTION_REQUIRED.value,
                    reset_required=True
                )
            else:
                return PolicyDecisionResult(
                    action="CONTINUE",
                    reason=f"STRONG_VIBRATION detected ({cnt}/{self.strong_persistence} persistence windows)",
                    persistence_count=cnt,
                    persistence_threshold=self.strong_persistence,
                    target_rpm=self.nominal_rpm
                )

        # 2. Mild Disturbance Check (REDUCE SPEED to 50%)
        elif score_mild >= self.mild_threshold:
            self._strong_counts[asset_id] = 0
            cnt = self._mild_counts.get(asset_id, 0) + 1
            self._mild_counts[asset_id] = cnt

            if cnt >= self.mild_persistence:
                return PolicyDecisionResult(
                    action="REDUCE_SPEED",
                    reason="MILD_VIBRATION (score >= 0.80 persistent)",
                    persistence_count=cnt,
                    persistence_threshold=self.mild_persistence,
                    target_rpm=self.reduced_rpm
                )
            else:
                return PolicyDecisionResult(
                    action="CONTINUE",
                    reason=f"MILD_VIBRATION detected ({cnt}/{self.mild_persistence} persistence windows)",
                    persistence_count=cnt,
                    persistence_threshold=self.mild_persistence,
                    target_rpm=self.nominal_rpm
                )

        # 3. Normal Operating Check (CONTINUE at nominal speed)
        elif score_normal >= self.normal_threshold:
            self._strong_counts[asset_id] = 0
            self._mild_counts[asset_id] = 0
            return PolicyDecisionResult(
                action="CONTINUE",
                reason="NORMAL_OPERATING_CONDITION",
                persistence_count=1,
                persistence_threshold=1,
                target_rpm=self.nominal_rpm
            )

        # 4. Model Uncertainty Fallback
        else:
            self._strong_counts[asset_id] = 0
            self._mild_counts[asset_id] = 0
            return PolicyDecisionResult(
                action="STOP",
                reason="MODEL_UNCERTAIN (No class exceeded confidence threshold)",
                persistence_count=1,
                persistence_threshold=1,
                target_rpm=0,
                latch_state=LatchReason.INSPECTION_REQUIRED.value,
                reset_required=True
            )

policy_engine = DeterministicPolicyEngine()
