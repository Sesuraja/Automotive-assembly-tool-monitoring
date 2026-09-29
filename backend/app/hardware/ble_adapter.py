import asyncio
import math
import random
import time
from datetime import datetime, timezone, timedelta
from typing import AsyncGenerator, Dict, Any, Optional
from app.hardware.base import BleHardwareAdapter

class IndustrialBleAdapter(BleHardwareAdapter):
    """
    Industrial BLE sensor adapter implementation.
    Isolates all low-level telemetry ingestion, sequence tracking, and signal decoding.
    Supports live simulated industrial test-bench signals and real hardware hooks.
    """
    def __init__(self):
        self._connected_devices: Dict[str, Dict[str, Any]] = {}
        self._sequences: Dict[str, int] = {}
        self._simulation_states: Dict[str, str] = {} # "NORMAL", "MILD_DISTURBANCE", "STRONG_DISTURBANCE"

    async def connect(self, device_address_or_id: str) -> bool:
        # Simulate connection handshake & GATT service discovery
        await asyncio.sleep(0.05)
        self._connected_devices[device_address_or_id] = {
            "address": device_address_or_id,
            "connected_at": datetime.now(timezone.utc),
            "battery_pct": 98,
            "rssi_dbm": -58
        }
        self._sequences[device_address_or_id] = 0
        if device_address_or_id not in self._simulation_states:
            self._simulation_states[device_address_or_id] = "NORMAL"
        return True

    async def discover(self) -> list[Dict[str, Any]]:
        return [
            {
                "device_id": "ble_node_01",
                "name": "Aperture Triaxial BLE Vibration Node #1",
                "ble_address": "D4:36:39:B2:11:04",
                "rssi": -62,
                "vendor": "Aperture Industrial Sensing",
                "battery": 98
            },
            {
                "device_id": "ble_node_02",
                "name": "Aperture Triaxial BLE Vibration Node #2",
                "ble_address": "D4:36:39:B2:88:9C",
                "rssi": -71,
                "vendor": "Aperture Industrial Sensing",
                "battery": 94
            }
        ]

    def set_condition_injection(self, device_id: str, condition: str) -> None:
        """Allows test scenarios and fault injection (NORMAL, MILD_DISTURBANCE, STRONG_DISTURBANCE)"""
        self._simulation_states[device_id] = condition

    async def read_telemetry(self, device_id: str) -> Optional[Dict[str, Any]]:
        if device_id not in self._connected_devices:
            # Auto-connect if discovered
            await self.connect(device_id)

        seq = self._sequences.get(device_id, 0) + 1
        self._sequences[device_id] = seq

        t = time.time()
        condition = self._simulation_states.get(device_id, "NORMAL")

        # Generate realistic physical acceleration waveforms:
        # Gravity baseline: ~1.0g on Z-axis, minor tilt on X/Y
        # Rotational baseline frequency ~30 Hz (1800 RPM)
        motor_hz = 30.0
        omega = 2.0 * math.pi * motor_hz * t

        if condition == "STRONG_DISTURBANCE":
            # High amplitude spikes, severe mechanical vibration & bearing impact harmonics
            amp_x = 0.85 * math.sin(omega) + 1.2 * math.sin(3.5 * omega) + random.gauss(0, 0.35)
            amp_y = 0.75 * math.cos(omega) + 1.1 * math.sin(5.2 * omega) + random.gauss(0, 0.30)
            amp_z = 1.0 + 1.4 * math.sin(2.2 * omega) + random.gauss(0, 0.45)
        elif condition == "MILD_DISTURBANCE":
            # Moderate tool wear / unbalance
            amp_x = 0.35 * math.sin(omega) + 0.30 * math.sin(2.0 * omega) + random.gauss(0, 0.12)
            amp_y = 0.30 * math.cos(omega) + 0.25 * math.sin(2.0 * omega) + random.gauss(0, 0.10)
            amp_z = 1.0 + 0.40 * math.sin(omega) + random.gauss(0, 0.15)
        else: # NORMAL
            # Low noise vibration, stable baseline
            amp_x = 0.08 * math.sin(omega) + random.gauss(0, 0.03)
            amp_y = 0.06 * math.cos(omega) + random.gauss(0, 0.03)
            amp_z = 0.98 + 0.09 * math.sin(omega) + random.gauss(0, 0.04)

        now = datetime.now(timezone.utc)
        
        if condition == "PACKET_LOSS":
            # Simulate 75% frame drop rate across BLE radio link
            if random.random() < 0.75:
                return None

        if condition == "STALE_DATA":
            # Simulate stale transmission buffer (>4.2 seconds age)
            stale_time = now - timedelta(seconds=4.2)
            return {
                "sensor_id": device_id,
                "sequence": seq,
                "timestamp_utc": stale_time,
                "received_at_utc": now,
                "accel_x": round(amp_x, 4),
                "accel_y": round(amp_y, 4),
                "accel_z": round(amp_z, 4),
                "health": "STALE_WARNING",
                "data_age_ms": 4200
            }

        return {
            "sensor_id": device_id,
            "sequence": seq,
            "timestamp_utc": now,
            "received_at_utc": now,
            "accel_x": round(amp_x, 4),
            "accel_y": round(amp_y, 4),
            "accel_z": round(amp_z, 4),
            "health": "OK",
            "data_age_ms": random.randint(15, 45)
        }

    async def subscribe_telemetry(self, device_id: str) -> AsyncGenerator[Dict[str, Any], None]:
        while device_id in self._connected_devices:
            packet = await self.read_telemetry(device_id)
            if packet:
                yield packet
            await asyncio.sleep(0.5)

    async def get_health(self, device_id: str) -> Dict[str, Any]:
        is_conn = device_id in self._connected_devices
        return {
            "device_id": device_id,
            "connected": is_conn,
            "battery_pct": self._connected_devices.get(device_id, {}).get("battery_pct", 95) if is_conn else 0,
            "rssi_dbm": self._connected_devices.get(device_id, {}).get("rssi_dbm", -65) if is_conn else -120,
            "status": "HEALTHY" if is_conn else "OFFLINE",
            "packet_loss_pct": 0.02 if is_conn else 100.0
        }

    async def send_control(self, device_id: str, command_payload: Dict[str, Any]) -> bool:
        if device_id not in self._connected_devices:
            return False
        return True

    async def disconnect(self, device_id: str) -> bool:
        if device_id in self._connected_devices:
            del self._connected_devices[device_id]
        return True

ble_adapter = IndustrialBleAdapter()
