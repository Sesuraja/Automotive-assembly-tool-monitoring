from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ModelVersionResponse(BaseModel):
    id: str
    model_id: str
    company_id: str
    version: str
    dataset_name: str
    features_version: str
    training_date: datetime
    status: str
    is_deployed: bool
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    strong_detection_rate: float
    false_intervention_rate: float
    confusion_matrix: Dict[str, Any] = {}

    class Config:
        from_attributes = True

class MLModelResponse(BaseModel):
    id: str
    company_id: str
    name: str
    algorithm: str
    description: Optional[str] = None
    is_active: bool
    versions: List[ModelVersionResponse] = []

    class Config:
        from_attributes = True

class MLModelCreate(BaseModel):
    name: str
    algorithm: str = "RandomForestClassifier"
    description: Optional[str] = None
    company_id: Optional[str] = None

class FeatureSetResponse(BaseModel):
    id: str
    company_id: str
    asset_id: str
    timestamp_utc: datetime
    rms: float
    peak: float
    crest_factor: float
    kurtosis: float
    band_energy_low: float
    band_energy_mid: float
    band_energy_high: float
    measured_motor_speed: float

class InferenceResponse(BaseModel):
    id: str
    asset_id: str
    timestamp_utc: datetime
    model_version: str
    score_normal: float
    score_mild: float
    score_strong: float
    predicted_class: str
    confidence: float
