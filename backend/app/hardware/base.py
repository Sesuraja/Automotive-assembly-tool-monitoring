from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, Optional
from datetime import datetime

class BleHardwareAdapter(ABC):
    """
    Abstract Hardware Adapter boundary for Bluetooth Low Energy vibration sensors.
    Vendor-specific UUIDs, GATT services, HTTP endpoints, packet decoding remain encapsulated here.
    """
    @abstractmethod
    async def connect(self, device_address_or_id: str) -> bool:
        """Establishes connection to the sensor node."""
        pass

    @abstractmethod
    async def discover(self) -> list[Dict[str, Any]]:
        """Scans for nearby industrial BLE vibration sensors."""
        pass

    @abstractmethod
    async def read_telemetry(self, device_id: str) -> Optional[Dict[str, Any]]:
        """Reads a single normalized telemetry packet."""
        pass

    @abstractmethod
    async def subscribe_telemetry(self, device_id: str) -> AsyncGenerator[Dict[str, Any], None]:
        """Streams continuous normalized telemetry frames from the sensor."""
        pass

    @abstractmethod
    async def get_health(self, device_id: str) -> Dict[str, Any]:
        """Queries battery, signal strength (RSSI), packet loss and internal health."""
        pass

    @abstractmethod
    async def send_control(self, device_id: str, command_payload: Dict[str, Any]) -> bool:
        """Sends sensor-level configuration or sampling parameter updates."""
        pass

    @abstractmethod
    async def disconnect(self, device_id: str) -> bool:
        """Safely disconnects from the BLE node."""
        pass


class MotorControllerAdapter(ABC):
    """
    Abstract Hardware Adapter for Local Motor Controller / VFD / Driver.
    Enforces local hardware limits, issues set-speed commands, and reads tachometer feedback.
    """
    @abstractmethod
    async def connect(self, endpoint: str) -> bool:
        """Connects to local controller via serial, Modbus RTU/TCP, or industrial fieldbus."""
        pass

    @abstractmethod
    async def set_speed(self, target_rpm: int) -> bool:
        """Commands motor target RPM with hardware limit clamping."""
        pass

    @abstractmethod
    async def emergency_cut(self) -> bool:
        """Immediately de-energizes motor drive / triggers hardware safe-torque-off (STO)."""
        pass

    @abstractmethod
    async def get_measured_rpm(self) -> int:
        """Reads actual tachometer/encoder measured RPM."""
        pass

    @abstractmethod
    async def get_health(self) -> Dict[str, Any]:
        """Queries drive temperature, faults, bus voltage and status."""
        pass

    @abstractmethod
    async def reset_hardware_trip(self) -> bool:
        """Executes hardware-level trip reset if safety interlocks allow."""
        pass

    @abstractmethod
    async def disconnect(self) -> bool:
        """Closes controller connection."""
        pass
