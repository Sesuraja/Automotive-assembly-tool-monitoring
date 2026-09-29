from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.company import Company
from app.models.user import User
from app.models.rbac import Role, UserRole
from app.models.operations import Site, Station, Asset
from app.models.hardware import Device
from app.models.fault import Fault
from app.models.command import Command
from app.models.organization import OrganizationNode
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse, CompanyStats
from app.core.security import get_password_hash
from app.core.permissions import Permission, CompanyRole
from app.core.tenant import verify_tenant_access
from app.services.audit_service import audit_service
from app.api.deps import get_current_user, require_super_admin, require_permission

router = APIRouter(prefix="/companies", tags=["Companies"])

@router.get("", response_model=List[CompanyResponse])
def list_companies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.is_super_admin:
        return db.query(Company).order_by(Company.created_at.desc()).all()
    else:
        if not current_user.company_id:
            return []
        return db.query(Company).filter(Company.id == current_user.company_id).all()

@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    req: CompanyCreate,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(Company).filter(Company.code == req.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company code already exists.")

    company = Company(
        name=req.name,
        legal_name=req.legal_name,
        code=req.code,
        industry=req.industry,
        country=req.country,
        timezone=req.timezone,
        contact_email=req.contact_email,
        phone=req.phone,
        status="ACTIVE",
        is_active=True
    )
    db.add(company)
    db.commit()
    db.refresh(company)

    # Step 2 of wizard: Create initial Company Admin if provided
    admin_user = None
    if req.admin_email and req.admin_password:
        admin_user = User(
            email=req.admin_email,
            full_name=req.admin_name or "Company Administrator",
            hashed_password=get_password_hash(req.password if hasattr(req, 'password') else req.admin_password),
            company_id=company.id,
            is_active=True,
            status="ACTIVE"
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        # Assign COMPANY_ADMIN role
        admin_role = db.query(Role).filter(Role.name == CompanyRole.COMPANY_ADMIN.value).first()
        if admin_role:
            ur = UserRole(user_id=admin_user.id, role_id=admin_role.id)
            db.add(ur)
            db.commit()

    # Step 3 of wizard: Create initial Site and Division if provided
    initial_site = None
    if req.initial_site_name:
        initial_site = Site(
            company_id=company.id,
            name=req.initial_site_name,
            code=req.initial_site_code or "SITE-01",
            location=f"{req.country} Plant",
            timezone=req.timezone
        )
        db.add(initial_site)
        db.commit()
        db.refresh(initial_site)

        # Create default Station and Asset for immediate out-of-the-box readiness
        station = Station(
            company_id=company.id,
            site_id=initial_site.id,
            name="Assembly Station 01",
            code="ST-01",
            status="READY"
        )
        db.add(station)
        db.commit()
        db.refresh(station)

        asset = Asset(
            company_id=company.id,
            station_id=station.id,
            name="Motor A (Assembly Tool)",
            asset_type="Motor",
            rated_rpm=1800,
            max_rpm=3000,
            current_state="READY"
        )
        db.add(asset)
        db.commit()

    if req.initial_division_name:
        node = OrganizationNode(
            company_id=company.id,
            name=req.initial_division_name,
            node_type="division",
            code="DIV-01"
        )
        db.add(node)
        db.commit()

    audit_service.log_event(
        db=db,
        action="CREATE_COMPANY",
        entity="Company",
        company_id=company.id,
        user_id=current_user.id,
        user_email=current_user.email,
        role="SUPER_ADMIN",
        entity_id=company.id,
        new_value={"name": company.name, "code": company.code}
    )

    return company

@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_super_admin:
        verify_tenant_access(company_id, current_user)
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: str,
    req: CompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_super_admin:
        verify_tenant_access(company_id, current_user)
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    old_val = {"name": company.name, "status": company.status}
    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(company, field, value)

    db.commit()
    db.refresh(company)

    audit_service.log_event(
        db=db,
        action="UPDATE_COMPANY",
        entity="Company",
        company_id=company.id,
        user_id=current_user.id,
        user_email=current_user.email,
        entity_id=company.id,
        old_value=old_val,
        new_value={"name": company.name, "status": company.status}
    )

    return company

@router.get("/platform/stats", response_model=CompanyStats)
def get_platform_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CompanyStats(
        company_id="platform_global",
        company_name="All Platform Tenants",
        total_users=db.query(User).count(),
        active_sites=db.query(Site).count(),
        total_stations=db.query(Station).count(),
        connected_devices=db.query(Device).count(),
        active_assets=db.query(Asset).count(),
        open_faults=db.query(Fault).filter(Fault.is_latched == True).count(),
        commands_count=db.query(Command).count()
    )

@router.get("/{company_id}/stats", response_model=CompanyStats)
def get_company_stats(
    company_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_super_admin:
        verify_tenant_access(company_id, current_user)
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return CompanyStats(
        company_id=company.id,
        company_name=company.name,
        total_users=db.query(User).filter(User.company_id == company_id).count(),
        active_sites=db.query(Site).filter(Site.company_id == company_id).count(),
        total_stations=db.query(Station).filter(Station.company_id == company_id).count(),
        connected_devices=db.query(Device).filter(Device.company_id == company_id).count(),
        active_assets=db.query(Asset).filter(Asset.company_id == company_id).count(),
        open_faults=db.query(Fault).filter(Fault.company_id == company_id, Fault.is_latched == True).count(),
        commands_count=db.query(Command).filter(Command.company_id == company_id).count()
    )
