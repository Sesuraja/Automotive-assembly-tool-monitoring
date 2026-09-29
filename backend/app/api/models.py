from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.ml import MLModel, ModelVersion
from app.models.user import User
from app.schemas.ml import MLModelResponse, ModelVersionResponse, MLModelCreate
from app.ml.registry import model_registry
from app.ml.engine import ml_engine
from app.services.audit_service import audit_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/models", tags=["AI & Models"])

@router.get("", response_model=List[MLModelResponse])
def list_models(
    company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_comp = company_id or current_user.company_id
    models = db.query(MLModel).all()
    if not models:
        # Auto-populate initial default model
        metrics = ml_engine.evaluate_metrics()
        m = MLModel(
            company_id=target_comp or "comp_default",
            name="motor_disturbance_classifier",
            algorithm="RandomForestClassifier",
            description="RandomForest model for automotive tool vibration classification",
            is_active=True
        )
        db.add(m)
        db.commit()
        db.refresh(m)

        v1 = ModelVersion(
            model_id=m.id,
            company_id=m.company_id,
            version="motor_v1",
            dataset_name="Automotive Tool Vibration D1",
            features_version="v1.0",
            status="DEPLOYED",
            is_deployed=True,
            accuracy=metrics["accuracy"],
            precision=metrics["precision"],
            recall=metrics["recall"],
            f1_score=metrics["f1_score"],
            strong_detection_rate=metrics["strong_detection_rate"],
            false_intervention_rate=metrics["false_intervention_rate"],
            confusion_matrix=metrics["confusion_matrix"]
        )
        db.add(v1)
        db.commit()
        models = [m]

    return models

@router.post("/{version_id}/deploy")
def deploy_model(
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ver = db.query(ModelVersion).filter(ModelVersion.id == version_id).first()
    if not ver:
        raise HTTPException(status_code=404, detail="Model version not found")

    # Mark others as not deployed
    db.query(ModelVersion).filter(ModelVersion.model_id == ver.model_id).update({"is_deployed": False, "status": "APPROVED"})
    ver.is_deployed = True
    ver.status = "DEPLOYED"
    db.commit()

    model_registry.deploy_version(ver.version)

    audit_service.log_event(
        db=db,
        action="DEPLOY_MODEL",
        entity="ModelVersion",
        company_id=ver.company_id,
        user_id=current_user.id,
        user_email=current_user.email,
        entity_id=ver.id,
        new_value={"version": ver.version}
    )
    return {"message": f"Model {ver.version} successfully deployed"}

@router.post("/rollback")
def rollback_model(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prev = model_registry.rollback()
    if not prev:
        raise HTTPException(status_code=400, detail="No previous validated model to rollback to.")
    return {"message": f"Successfully rolled back to: {prev}"}
