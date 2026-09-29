from enum import Enum
from typing import Optional, Tuple
from datetime import datetime, timezone

class EquipmentState(str, Enum):
    IDLE = "IDLE"
    CONNECTING = "CONNECTING"
    READY = "READY"
    COLLECTING = "COLLECTING"
    INFERENCING = "INFERENCING"
    DECIDING = "DECIDING"
    RUNNING = "RUNNING"
    REDUCING_SPEED = "REDUCING_SPEED"
    VERIFYING_RPM = "VERIFYING_RPM"
    RUNNING_REDUCED = "RUNNING_REDUCED"
    STOPPING = "STOPPING"
    LATCHED_STOP = "LATCHED_STOP"
    FAULT = "FAULT"

class LatchReason(str, Enum):
    NONE = "NONE"
    INSPECTION_REQUIRED = "INSPECTION_REQUIRED"
    DATA_FAULT = "DATA_FAULT"
    CONTROLLER_FAULT = "CONTROLLER_FAULT"
    EMERGENCY_STOP = "EMERGENCY_STOP"
    HARDWARE_FAULT = "HARDWARE_FAULT"

class SafetyStateMachine:
    """
    Station and Asset Safety State Machine strictly enforcing Section 28:
    A latched stop or fault CANNOT automatically restart.
    Transition from LATCHED_STOP / FAULT to READY strictly requires an explicit operator reset.
    """
    def __init__(self, initial_state: EquipmentState = EquipmentState.READY):
        self.state: EquipmentState = initial_state
        self.latch: LatchReason = LatchReason.NONE
        self.last_transition_time = datetime.now(timezone.utc)
        self.transition_log = []

    def can_transition_to(self, target: EquipmentState) -> bool:
        if self.state in [EquipmentState.LATCHED_STOP, EquipmentState.FAULT]:
            # No automatic transition allowed from latched stop!
            return False
        return True

    def transition(self, target: EquipmentState, reason: str = "") -> bool:
        if self.state in [EquipmentState.LATCHED_STOP, EquipmentState.FAULT] and target not in [EquipmentState.READY]:
            # Prohibit leaving latched stop without operator reset
            return False

        old_state = self.state
        self.state = target
        self.last_transition_time = datetime.now(timezone.utc)
        self.transition_log.append({
            "from": old_state.value,
            "to": target.value,
            "reason": reason,
            "timestamp": self.last_transition_time.isoformat()
        })
        return True

    def trigger_latched_stop(self, latch_reason: LatchReason, reason: str = "") -> None:
        self.state = EquipmentState.LATCHED_STOP
        self.latch = latch_reason
        self.last_transition_time = datetime.now(timezone.utc)
        self.transition_log.append({
            "from": "DECIDING",
            "to": EquipmentState.LATCHED_STOP.value,
            "reason": f"Latched Stop: {latch_reason.value} - {reason}",
            "timestamp": self.last_transition_time.isoformat()
        })

    def trigger_fault(self, fault_reason: str) -> None:
        self.state = EquipmentState.FAULT
        self.latch = LatchReason.HARDWARE_FAULT
        self.last_transition_time = datetime.now(timezone.utc)
        self.transition_log.append({
            "from": self.state.value,
            "to": EquipmentState.FAULT.value,
            "reason": f"Fault Trip: {fault_reason}",
            "timestamp": self.last_transition_time.isoformat()
        })

    def operator_reset(self, operator_email: str, notes: str) -> Tuple[bool, str]:
        """
        Operator-initiated manual reset. Required to unlatch.
        """
        if self.state not in [EquipmentState.LATCHED_STOP, EquipmentState.FAULT]:
            return False, "Equipment is not in a latched state."

        old_state = self.state.value
        old_latch = self.latch.value
        self.state = EquipmentState.READY
        self.latch = LatchReason.NONE
        self.last_transition_time = datetime.now(timezone.utc)
        self.transition_log.append({
            "from": old_state,
            "to": EquipmentState.READY.value,
            "reason": f"Operator Reset by {operator_email}: {notes}",
            "timestamp": self.last_transition_time.isoformat()
        })
        return True, "Reset successful. Equipment transitioned to READY."
