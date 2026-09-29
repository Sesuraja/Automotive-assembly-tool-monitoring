export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  company_id: string | null;
  company_name: string | null;
  roles: string[];
  permissions: string[];
  site_id?: string;
  department_id?: string;
  project_id?: string;
}

export interface Company {
  id: string;
  code: string;
  name: string;
  legal_name?: string;
  industry: string;
  country: string;
  timezone: string;
  contact_email: string;
  phone?: string;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyStats {
  company_id: string;
  company_name: string;
  total_users: number;
  active_sites: number;
  total_stations: number;
  connected_devices: number;
  active_assets: number;
  open_faults: number;
  commands_count: number;
}

export interface OrgNode {
  id: string;
  company_id: string;
  parent_id: string | null;
  name: string;
  code?: string;
  node_type: string;
  manager_id?: string;
  children: OrgNode[];
}

export interface Site {
  id: string;
  company_id: string;
  name: string;
  code: string;
  location?: string;
  timezone: string;
  status: string;
}

export interface Station {
  id: string;
  company_id: string;
  site_id: string;
  name: string;
  code: string;
  status: string;
  is_latched: string;
}

export interface Asset {
  id: string;
  company_id: string;
  station_id: string;
  name: string;
  asset_type: string;
  serial_number?: string;
  rated_rpm: number;
  max_rpm: number;
  current_state: string;
  active_latch: string;
}

export interface Device {
  id: string;
  device_id: string;
  name: string;
  device_type: string;
  vendor: string;
  ble_address?: string;
  firmware_version: string;
  hardware_revision: string;
  battery_pct: number;
  connection_status: string;
  health_status: string;
  company_id: string;
  mapped_asset_id?: string;
  mapped_asset_name?: string;
  mapped_station_name?: string;
}

export interface LiveTelemetryState {
  asset_id: string;
  asset_name: string;
  station_id: string;
  station_name: string;
  connection_status: string;
  sensor_health: string;
  data_age_ms: number;
  telemetry: {
    sequence: number;
    accel_x: number;
    accel_y: number;
    accel_z: number;
    motor_rpm: number;
    commanded_rpm: number;
  };
  features: {
    rms: number;
    peak: number;
    crest_factor: number;
    kurtosis: number;
    band_energy_low?: number;
    band_energy_mid?: number;
    band_energy_high?: number;
    measured_motor_speed?: number;
  };
  ai: {
    model_version: string;
    score_normal: number;
    score_mild: number;
    score_strong: number;
    predicted_class: string;
    confidence: number;
  };
  decision: {
    action: string;
    reason: string;
    persistence_count: number;
    persistence_threshold: number;
    target_rpm: number;
    latch_state: string;
    reset_required: boolean;
  };
  command: {
    command_id: string | null;
    target_rpm: number;
    controller_status: string;
    measured_rpm: number;
    status: string;
  };
  state: {
    current_state: string;
    active_latch: string;
    reset_required: boolean;
  };
  timestamp?: string;
}

export interface Fault {
  id: string;
  company_id: string;
  asset_id: string;
  category: string;
  severity: string;
  reason: string;
  detected_at: string;
  is_latched: boolean;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface Command {
  id: string;
  command_id: string;
  company_id: string;
  asset_id: string;
  command_type: string;
  target_rpm: number;
  reason: string;
  model_version?: string;
  decision_id?: string;
  created_at: string;
  expires_at: string;
  status: string;
}

export interface EventTrace {
  id: string;
  trace_id: string;
  company_id: string;
  asset_id: string;
  sensor_event_id?: string;
  telemetry_id?: string;
  inference_id?: string;
  decision_id?: string;
  command_id?: string;
  feedback_id?: string;
  physical_result_rpm?: number;
  timestamp_utc: string;
  duration_ms: number;
  summary?: string;
}

export interface AuditLog {
  id: string;
  company_id?: string;
  user_email?: string;
  role?: string;
  action: string;
  entity: string;
  entity_id?: string;
  timestamp_utc: string;
  result: string;
  reason?: string;
}
