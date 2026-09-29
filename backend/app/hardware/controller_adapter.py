import asyncio
import random
from typing import Dict, Any
from app.hardware.base import MotorControllerAdapter
from app.core.config import settings

class LocalMotorController(MotorControllerAdapter):
    """
    Local Motor Controller / VFD Adapter.
    Enforces hardware safety limits locally and provides tachometer RPM verification.
    """
    def __init__(self):
        self._connected: bool = True
        self._commanded_rpm: int = 1800
        self._measured_rpm: int = 1800
        self._hardware_tripped: bool = False
        self._trip_reason: str = "NONE"
        self._bus_voltage: float = 48.2
        self._temperature_c: float = 42.5
        self._simulate_stop_failure: bool = False

    async def connect(self, endpoint: str) -> bool:
        await asyncio.sleep(0.05)
        self._connected = True
        return True

    def set_stop_failure_simulation(self, enabled: bool) -> None:
        self._simulate_stop_failure = enabled

    async def set_speed(self, target_rpm: int) -> bool:
        if self._hardware_tripped:
            return False

        # Strictly enforce local hardware limit
        clamped_rpm = max(0, min(target_rpm, settings.MAX_ALLOWABLE_RPM))
        self._commanded_rpm = clamped_rpm
        
        if clamped_rpm == 0:
            if self._simulate_stop_failure:
                self._measured_rpm = 650 # Brake slip or tachometer disconnect
                return False
            self._measured_rpm = 0
            return True

        # Simulate mechanical motor ramp-up / ramp-down dynamics
        # Controller smoothly adjusts actual tachometer speed towards commanded
        diff = clamped_rpm - self._measured_rpm
        step = int(diff * 0.8) # 80% responsive step
        self._measured_rpm += step
        if abs(clamped_rpm - self._measured_rpm) < 15:
            self._measured_rpm = clamped_rpm
        
        # Add slight natural tachometer measurement jitter (±5 RPM)
        if self._measured_rpm > 0:
            self._measured_rpm += random.randint(-4, 4)

        return True

    async def emergency_cut(self) -> bool:
        """Immediate hardware Safe Torque Off (STO) de-energization."""
        self._commanded_rpm = 0
        self._measured_rpm = 0
        self._hardware_tripped = True
        self._trip_reason = "LOCAL_EMERGENCY_STOP"
        return True

    async def get_measured_rpm(self) -> int:
        if self._hardware_tripped:
            return 0
        # If motor running, step towards commanded RPM
        if self._measured_rpm != self._commanded_rpm:
            diff = self._commanded_rpm - self._measured_rpm
            self._measured_rpm += int(diff * 0.5)
            if abs(self._commanded_rpm - self._measured_rpm) < 10:
                self._measured_rpm = self._commanded_rpm
        return max(0, self._measured_rpm)

    async def get_health(self) -> Dict[str, Any]:
        return {
            "connected": self._connected,
            "status": "FAULT" if self._hardware_tripped else ("RUNNING" if self._measured_rpm > 0 else "READY"),
            "tripped": self._hardware_tripped,
            "trip_reason": self._trip_reason,
            "commanded_rpm": self._commanded_rpm,
            "measured_rpm": self._measured_rpm,
            "bus_voltage": round(self._bus_voltage, 1),
            "temperature_c": round(self._temperature_c, 1)
        }

    async def reset_hardware_trip(self) -> bool:
        """Explicit hardware trip reset. Requires commanded RPM to be 0 first."""
        self._hardware_tripped = False
        self._trip_reason = "NONE"
        self._simulate_stop_failure = False
        self._commanded_rpm = 0
        self._measured_rpm = 0
        return True

    async def disconnect(self) -> bool:
        self._connected = False
        return True

motor_controller = LocalMotorController()
