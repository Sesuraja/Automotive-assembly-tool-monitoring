from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.policy import DecisionPolicy, PolicyVersion
from app.models.user import User
from app.schemas.policy import DecisionPolicyResponse, DecisionPolicyCreate
from app.services.audit_service import audit_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/policies", tags=["Decision Policies"])

@router.get("", response_model=List[DecisionPolicyResponse])
def list_policies(
    company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_comp = company_id or current_user.company_id
    policies = db.query(DecisionPolicy).all()
    if not policies:
        # Create default policy
        p = DecisionPolicy(
            company_id=target_comp or "comp_default",
            name="Automotive Assembly Tool Safety Policy",
            description="Deterministic policy enforcing PRD vibration thresholds and persistence windows",
            is_active=True
        )
        db.add(p)
        db.commit()
        db.refresh(p)

        pv = PolicyVersion(
            policy_id=p.id,
            company_id=p.company_id,
            version="pol_v1.0",
            status="ACTIVE",
            is_active=True,
            strong_threshold=0.85,
            strong_persistence_windows=2,
            mild_threshold=0.80,
            mild_persistence_windows=3,
            normal_threshold=0.90,
            stale_data_timeout_sec=3.0,
            reduced_speed_ratio=0.50
        )
        db.add(pv)
        db.commit()
        policies = [p]

    return policies

@router.post("", response_model=DecisionPolicyResponse, status_code=status.HTTP_201_CREATED)
def create_policy(
    req: DecisionPolicyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_comp = req.company_id or current_user.company_id
    p = DecisionPolicy(
        company_id=target_comp,
        name=req.name,
        description=req.description,
        is_active=True
    )
    db.add(p)
    db.commit()
    db.refresh(p)

    pv = PolicyVersion(
        policy_id=p.id,
        company_id=p.company_id,
        version="pol_v1.0",
        status="ACTIVE",
        is_active=True,
        strong_threshold=req.strong_threshold,
        strong_persistence_windows=req.strong_persistence_windows,
        mild_threshold=req.mild_threshold,
        mild_persistence_windows=req.mild_persistence_windows,
        normal_threshold=req.normal_threshold,
        stale_data_timeout_sec=req.stale_data_timeout_sec,
        reduced_speed_ratio=req.reduced_speed_ratio
    )
    db.add(pv)
    db.commit()
    db.refresh(p)

    audit_service.log_event(
        db=db,
        action="CREATE_POLICY",
        entity="DecisionPolicy",
        company_id=target_comp,
        user_id=current_user.id,
        user_email=current_user.email,
        entity_id=p.id,
        new_value={"name": p.name}
    )
    return p
