from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.telemetry import Run
from app.models.user import User
from app.schemas.telemetry import RunResponse
from app.core.tenant import verify_tenant_access
from app.api.deps import get_current_user

router = APIRouter(prefix="/runs", tags=["Runs"])

@router.get("", response_model=List[RunResponse])
def list_runs(
    company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_comp = company_id or current_user.company_id
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)
    query = db.query(Run)
    if target_comp:
        query = query.filter(Run.company_id == target_comp)
    return query.order_by(Run.start_time.desc()).limit(50).all()
