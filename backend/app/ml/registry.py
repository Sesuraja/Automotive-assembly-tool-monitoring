from typing import Dict, Any, Optional, List
from app.ml.engine import VibrationMLEngine, ml_engine

class ModelRegistry:
    """
    Model Registry managing active version, validation status, and deployment/rollback.
    """
    def __init__(self):
        self._active_version: str = "motor_v1"
        self._models: Dict[str, VibrationMLEngine] = {
            "motor_v1": ml_engine,
            "motor_v2_experimental": VibrationMLEngine("motor_v2_experimental")
        }
        self._history: List[str] = ["motor_v1"]

    def get_active_model(self) -> VibrationMLEngine:
        return self._models.get(self._active_version, ml_engine)

    def get_active_version(self) -> str:
        return self._active_version

    def deploy_version(self, version: str) -> bool:
        if version not in self._models:
            self._models[version] = VibrationMLEngine(version)
        self._active_version = version
        self._history.append(version)
        return True

    def rollback(self) -> Optional[str]:
        if len(self._history) > 1:
            self._history.pop()
            previous = self._history[-1]
            self._active_version = previous
            return previous
        return None

model_registry = ModelRegistry()
