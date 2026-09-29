from fastapi import APIRouter, Depends
from app.models.user import User
from app.services.acceptance_tests import acceptance_suite
from app.api.deps import get_current_user

router = APIRouter(prefix="/acceptance", tags=["Acceptance Testing"])

@router.post("/run")
async def run_acceptance_tests(current_user: User = Depends(get_current_user)):
    """Runs all 8 PRD acceptance test scenarios."""
    result = await acceptance_suite.run_suite(current_user.email)
    return result
