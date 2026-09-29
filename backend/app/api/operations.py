from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.operations import Site, Department, Project, Station, Asset
from app.models.user import User
from app.schemas.operations import (
    SiteCreate, SiteUpdate, SiteResponse,
    DepartmentCreate, DepartmentResponse,
    ProjectCreate, ProjectUpdate, ProjectResponse,
    StationCreate, StationUpdate, StationResponse,
    AssetCreate, AssetUpdate, AssetResponse
)
from app.core.tenant import verify_tenant_access
from app.services.audit_service import audit_service
from app.api.deps import get_current_user

router = APIRouter(tags=["Operations"])

# ----------------- SITES -----------------
@router.get("/sites", response_model=List[SiteResponse])
def list_sites(company_id: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target_comp = company_id or current_user.company_id
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)
    query = db.query(Site)
    if target_comp:
        query = query.filter(Site.company_id == target_comp)
    return query.all()

@router.post("/sites", response_model=SiteResponse, status_code=status.HTTP_201_CREATED)
def create_site(req: SiteCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)
    site = Site(company_id=target_comp, name=req.name, code=req.code, location=req.location, timezone=req.timezone)
    db.add(site)
    db.commit()
    db.refresh(site)
    return site

# ----------------- PROJECTS -----------------
@router.get("/projects", response_model=List[ProjectResponse])
def list_projects(company_id: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target_comp = company_id or current_user.company_id
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)
    query = db.query(Project)
    if target_comp:
        query = query.filter(Project.company_id == target_comp)
    return query.all()

@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(req: ProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)
    proj = Project(company_id=target_comp, name=req.name, code=req.code, site_id=req.site_id)
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj

# ----------------- STATIONS -----------------
@router.get("/stations", response_model=List[StationResponse])
def list_stations(company_id: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target_comp = company_id or current_user.company_id
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)
    query = db.query(Station)
    if target_comp:
        query = query.filter(Station.company_id == target_comp)
    return query.all()

@router.post("/stations", response_model=StationResponse, status_code=status.HTTP_201_CREATED)
def create_station(req: StationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)
    st = Station(company_id=target_comp, site_id=req.site_id, project_id=req.project_id, name=req.name, code=req.code, status="READY")
    db.add(st)
    db.commit()
    db.refresh(st)
    return st

# ----------------- ASSETS -----------------
@router.get("/assets", response_model=List[AssetResponse])
def list_assets(company_id: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target_comp = company_id or current_user.company_id
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)
    query = db.query(Asset)
    if target_comp:
        query = query.filter(Asset.company_id == target_comp)
    return query.all()

@router.post("/assets", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(req: AssetCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)
    asset = Asset(
        company_id=target_comp,
        station_id=req.station_id,
        name=req.name,
        asset_type=req.asset_type,
        serial_number=req.serial_number,
        rated_rpm=req.rated_rpm,
        max_rpm=req.max_rpm,
        current_state="READY"
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset

@router.get("/assets/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if not current_user.is_super_admin:
        verify_tenant_access(asset.company_id, current_user)
    return asset
