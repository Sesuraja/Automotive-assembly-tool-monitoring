import sys
from sqlalchemy.orm import Session
from app.database.session import SessionLocal, engine
from app.database.base import Base
import app.models # Ensure all models are registered in Base.metadata
from app.models.rbac import Role, PermissionModel, RolePermission, UserRole
from app.models.user import User
from app.models.company import Company
from app.models.operations import Site, Station, Asset
from app.models.hardware import Device, Controller, DeviceMapping
from app.core.security import get_password_hash
from app.core.permissions import PlatformRole, CompanyRole, ALL_PERMISSIONS, ROLE_PERMISSIONS_MAP

def seed_database():
    print("[Seed] Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Seed Permissions
        print("[Seed] Registering fine-grained RBAC permissions...")
        perm_map = {}
        for perm_name in ALL_PERMISSIONS:
            category = perm_name.split(".")[0]
            p = db.query(PermissionModel).filter(PermissionModel.name == perm_name).first()
            if not p:
                p = PermissionModel(name=perm_name, category=category, description=f"Permission for {perm_name}")
                db.add(p)
                db.flush()
            perm_map[perm_name] = p

        # 2. Seed Default System Roles
        print("[Seed] Registering platform and company roles...")
        for r_name, p_names in ROLE_PERMISSIONS_MAP.items():
            role = db.query(Role).filter(Role.name == r_name).first()
            if not role:
                role = Role(name=r_name, description=f"Standard {r_name} role", is_system=True)
                db.add(role)
                db.flush()
                # Link role permissions
                for p_name in p_names:
                    if p_name in perm_map:
                        rp = RolePermission(role_id=role.id, permission_id=perm_map[p_name].id)
                        db.add(rp)

        db.commit()

        # 3. Create Super Admin if not exists
        super_admin = db.query(User).filter(User.email == "admin@aperture.io").first()
        if not super_admin:
            print("[Seed] Creating Global Super Admin (admin@aperture.io)...")
            super_admin = User(
                email="admin@aperture.io",
                full_name="Global Super Administrator",
                hashed_password=get_password_hash("AdminPass123!"),
                is_super_admin=True,
                is_active=True,
                status="ACTIVE"
            )
            db.add(super_admin)
            db.commit()
            db.refresh(super_admin)

            # Assign SUPER_ADMIN role
            s_role = db.query(Role).filter(Role.name == PlatformRole.SUPER_ADMIN.value).first()
            if s_role:
                ur = UserRole(user_id=super_admin.id, role_id=s_role.id)
                db.add(ur)
                db.commit()

        # 4. Check if demo flag or seed requested initial enterprise company for out-of-the-box readiness
        # If no companies exist, create standard reference company: Aperture Automotive
        comp = db.query(Company).first()
        if not comp:
            print("[Seed] Creating reference automotive tenant (Aperture Automotive)...")
            comp = Company(
                code="APERTURE-AUTO",
                name="Aperture Automotive Ltd",
                legal_name="Aperture Automotive Technologies Inc.",
                industry="Automotive Assembly & Powertrain",
                country="Canada",
                timezone="America/Toronto",
                contact_email="operations@aperture-auto.com",
                phone="+1-416-555-0199",
                status="ACTIVE",
                is_active=True
            )
            db.add(comp)
            db.commit()
            db.refresh(comp)

            # Create Company Admin
            comp_admin = User(
                email="admin@aperture-auto.com",
                full_name="Sarah Chen (Plant Director)",
                hashed_password=get_password_hash("CompanyPass123!"),
                company_id=comp.id,
                is_active=True,
                status="ACTIVE"
            )
            db.add(comp_admin)
            db.commit()
            db.refresh(comp_admin)

            ca_role = db.query(Role).filter(Role.name == CompanyRole.COMPANY_ADMIN.value).first()
            if ca_role:
                db.add(UserRole(user_id=comp_admin.id, role_id=ca_role.id))

            # Create Site
            site = Site(
                company_id=comp.id,
                name="Toronto Assembly Facility #4",
                code="TOR-PLANT-04",
                location="Toronto, ON, Canada",
                timezone="America/Toronto",
                status="ACTIVE"
            )
            db.add(site)
            db.commit()
            db.refresh(site)

            # Create Station
            station = Station(
                company_id=comp.id,
                site_id=site.id,
                name="Powertrain Fastening Station 01",
                code="ST-01",
                status="READY"
            )
            db.add(station)
            db.commit()
            db.refresh(station)

            # Create Asset
            asset = Asset(
                company_id=comp.id,
                station_id=station.id,
                name="Motor A (Fastener Drive Spindle)",
                asset_type="Assembly Tool Spindle",
                serial_number="MOT-7740-A",
                rated_rpm=1800,
                max_rpm=3000,
                current_state="READY"
            )
            db.add(asset)
            db.commit()
            db.refresh(asset)

            # Register Controller
            ctrl = Controller(
                company_id=comp.id,
                station_id=station.id,
                asset_id=asset.id,
                name="VFD Spindle Controller 01",
                controller_type="VFD_MOTOR_CONTROLLER",
                vendor="Aperture Local Controller",
                interface_endpoint="local://serial-0",
                status="READY",
                last_measured_rpm=1800,
                last_commanded_rpm=1800
            )
            db.add(ctrl)

            # Register BLE Device & Mapping
            dev = Device(
                company_id=comp.id,
                device_id="ble_node_01",
                name="Aperture Triaxial BLE Vibration Node #1",
                device_type="BLE_VIBRATION_SENSOR",
                vendor="Aperture Industrial Sensing",
                ble_address="D4:36:39:B2:11:04",
                firmware_version="1.2.4",
                hardware_revision="rev-B",
                battery_pct=98,
                connection_status="CONNECTED",
                health_status="HEALTHY"
            )
            db.add(dev)
            db.commit()
            db.refresh(dev)

            mapping = DeviceMapping(
                company_id=comp.id,
                device_id=dev.id,
                asset_id=asset.id,
                station_id=station.id,
                is_active=True
            )
            db.add(mapping)
            db.commit()

        print("[Seed] Database seed completed successfully!")
        print("Super Admin credentials: admin@aperture.io / AdminPass123!")
        print("Company Admin credentials: admin@aperture-auto.com / CompanyPass123!")

    except Exception as e:
        db.rollback()
        print(f"[Seed Error] {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
