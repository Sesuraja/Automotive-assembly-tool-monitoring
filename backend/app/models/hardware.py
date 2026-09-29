from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

class BleGateway(Base, TimestampMixin):
    __tablename__ = "ble_gateways"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    gateway_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. GW-001
    name = Column(String(255), nullable=False)
    ip_address = Column(String(100), default="192.168.1.100")
    mac_address = Column(String(100), nullable=True)
    protocol = Column(String(50), default="HTTP_REST") # HTTP_REST, MQTT, WEBSOCKET
    firmware_version = Column(String(50), default="2.1.0")
    status = Column(String(50), default="ONLINE") # ONLINE, OFFLINE, DEGRADED
    last_heartbeat_utc = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    config_json = Column(JSON, default=dict)

class Device(Base, TimestampMixin):
    __tablename__ = "devices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. ble_node_01
    name = Column(String(255), nullable=False)
    device_type = Column(String(100), default="BLE_VIBRATION_SENSOR") # BLE_VIBRATION_SENSOR, TACHOMETER, MULTI_SENSOR
    vendor = Column(String(100), default="Generic Industrial BLE")
    ble_address = Column(String(100), nullable=True)
    gateway_id = Column(String(100), nullable=True) # Assigned Gateway ID e.g. GW-001
    sampling_rate_hz = Column(Integer, default=3200)
    rssi_dbm = Column(Integer, default=-65)
    firmware_version = Column(String(50), default="1.0.0")
    hardware_revision = Column(String(50), default="rev-A")
    battery_pct = Column(Integer, default=100)
    connection_status = Column(String(50), default="CONNECTED") # DISCONNECTED, CONNECTING, CONNECTED, FAULT
    health_status = Column(String(50), default="HEALTHY") # HEALTHY, DEGRADED, FAULT, OFFLINE
    last_seen_utc = Column(DateTime(timezone=True), nullable=True)
    config_json = Column(JSON, default=dict)

    company = relationship("Company", back_populates="devices")
    mappings = relationship("DeviceMapping", back_populates="device", cascade="all, delete-orphan")

class Controller(Base, TimestampMixin):
    __tablename__ = "controllers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    station_id = Column(String(36), ForeignKey("stations.id", ondelete="SET NULL"), nullable=True, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    controller_type = Column(String(100), default="VFD_MOTOR_CONTROLLER")
    vendor = Column(String(100), default="Aperture Control System")
    interface_endpoint = Column(String(255), default="local://serial-0")
    status = Column(String(50), default="READY")  # READY, RUNNING, FAULT, OFFLINE
    last_measured_rpm = Column(Integer, default=0)
    last_commanded_rpm = Column(Integer, default=0)

    company = relationship("Company", back_populates="controllers")
    asset = relationship("Asset", back_populates="controllers")

class DeviceMapping(Base, TimestampMixin):
    __tablename__ = "device_mappings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id = Column(String(36), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    station_id = Column(String(36), ForeignKey("stations.id", ondelete="CASCADE"), nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    active_from = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    active_to = Column(DateTime(timezone=True), nullable=True)

    device = relationship("Device", back_populates="mappings")
