from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class OperationalReport(BaseModel):
    company_id: str
    company_name: str
    period_start: datetime
    period_end: datetime
    total_runtime_hours: float
    total_commands: int
    emergency_stops: int
    total_faults: int
    average_motor_rpm: float
    total_event_traces: int

class AIReport(BaseModel):
    model_id: str
    model_name: str
    model_version: str
    dataset_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    strong_disturbance_detection: float
    false_intervention_rate: float
    confusion_matrix: Dict[str, Any]
    evaluation_samples: int

class AcceptanceTestItem(BaseModel):
    test_id: str
    name: str
    description: str
    expected_result: str
    actual_result: str
    status: str # PASS, FAIL, IN_PROGRESS
    timestamp_utc: datetime
    hardware_revision: str = "rev-A"
    model_version: str = "motor_v1"

class AcceptanceTestReport(BaseModel):
    company_id: str
    suite_id: str
    tested_at: datetime
    operator_email: str
    overall_status: str # PASS, FAIL
    passed_count: int
    failed_count: int
    items: List[AcceptanceTestItem]

class AuditReportSummary(BaseModel):
    company_id: Optional[str]
    total_events: int
    action_counts: Dict[str, int]
    top_actors: List[Dict[str, Any]]
    recent_security_events: List[Dict[str, Any]]
