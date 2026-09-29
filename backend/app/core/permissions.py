from enum import Enum
from typing import Dict, List, Set

class PlatformRole(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    PLATFORM_SUPPORT = "PLATFORM_SUPPORT"

class CompanyRole(str, Enum):
    COMPANY_ADMIN = "COMPANY_ADMIN"
    COMPANY_MANAGER = "COMPANY_MANAGER"
    ORGANIZATION_ADMIN = "ORGANIZATION_ADMIN"
    SITE_ADMIN = "SITE_ADMIN"
    DEPARTMENT_ADMIN = "DEPARTMENT_ADMIN"
    PROJECT_ADMIN = "PROJECT_ADMIN"
    ML_ENGINEER = "ML_ENGINEER"
    INTEGRATION_ENGINEER = "INTEGRATION_ENGINEER"
    HARDWARE_ENGINEER = "HARDWARE_ENGINEER"
    TEST_ENGINEER = "TEST_ENGINEER"
    OPERATOR = "OPERATOR"
    VIEWER = "VIEWER"

class Permission(str, Enum):
    # Company
    COMPANY_VIEW = "company.view"
    COMPANY_CREATE = "company.create"
    COMPANY_UPDATE = "company.update"
    COMPANY_DELETE = "company.delete"

    # Users
    USERS_VIEW = "users.view"
    USERS_CREATE = "users.create"
    USERS_UPDATE = "users.update"
    USERS_DELETE = "users.delete"

    # Roles & Permissions
    ROLES_VIEW = "roles.view"
    ROLES_CREATE = "roles.create"
    ROLES_UPDATE = "roles.update"
    ROLES_DELETE = "roles.delete"

    # Sites
    SITES_VIEW = "sites.view"
    SITES_CREATE = "sites.create"
    SITES_UPDATE = "sites.update"
    SITES_DELETE = "sites.delete"

    # Projects
    PROJECTS_VIEW = "projects.view"
    PROJECTS_CREATE = "projects.create"
    PROJECTS_UPDATE = "projects.update"
    PROJECTS_DELETE = "projects.delete"

    # Assets & Stations
    ASSETS_VIEW = "assets.view"
    ASSETS_CREATE = "assets.create"
    ASSETS_UPDATE = "assets.update"
    ASSETS_DELETE = "assets.delete"

    # Devices & Hardware
    DEVICES_VIEW = "devices.view"
    DEVICES_ENROLL = "devices.enroll"
    DEVICES_CONNECT = "devices.connect"
    DEVICES_DISCONNECT = "devices.disconnect"

    # Telemetry
    TELEMETRY_VIEW = "telemetry.view"
    TELEMETRY_EXPORT = "telemetry.export"

    # ML Models
    MODELS_VIEW = "models.view"
    MODELS_CREATE = "models.create"
    MODELS_DEPLOY = "models.deploy"
    MODELS_ROLLBACK = "models.rollback"

    # Policies
    POLICIES_VIEW = "policies.view"
    POLICIES_CREATE = "policies.create"
    POLICIES_UPDATE = "policies.update"
    POLICIES_ACTIVATE = "policies.activate"

    # Commands & Control
    COMMANDS_VIEW = "commands.view"
    COMMANDS_CREATE = "commands.create"
    COMMANDS_RESET = "commands.reset"

    # Faults
    FAULTS_VIEW = "faults.view"
    FAULTS_ACKNOWLEDGE = "faults.acknowledge"
    FAULTS_RESET = "faults.reset"

    # Reports
    REPORTS_VIEW = "reports.view"
    REPORTS_EXPORT = "reports.export"

    # Audit & Settings
    AUDIT_VIEW = "audit.view"
    SETTINGS_MANAGE = "settings.manage"

# Default role-to-permissions mapping
ALL_PERMISSIONS = [p.value for p in Permission]

ROLE_PERMISSIONS_MAP: Dict[str, List[str]] = {
    PlatformRole.SUPER_ADMIN.value: ALL_PERMISSIONS,
    PlatformRole.PLATFORM_SUPPORT.value: [
        Permission.COMPANY_VIEW.value,
        Permission.USERS_VIEW.value,
        Permission.ROLES_VIEW.value,
        Permission.SITES_VIEW.value,
        Permission.PROJECTS_VIEW.value,
        Permission.ASSETS_VIEW.value,
        Permission.DEVICES_VIEW.value,
        Permission.TELEMETRY_VIEW.value,
        Permission.MODELS_VIEW.value,
        Permission.POLICIES_VIEW.value,
        Permission.COMMANDS_VIEW.value,
        Permission.FAULTS_VIEW.value,
        Permission.REPORTS_VIEW.value,
        Permission.AUDIT_VIEW.value,
    ],
    CompanyRole.COMPANY_ADMIN.value: [
        p.value for p in Permission if p != Permission.COMPANY_CREATE and p != Permission.COMPANY_DELETE
    ],
    CompanyRole.COMPANY_MANAGER.value: [
        Permission.COMPANY_VIEW.value,
        Permission.USERS_VIEW.value,
        Permission.SITES_VIEW.value,
        Permission.PROJECTS_VIEW.value,
        Permission.ASSETS_VIEW.value,
        Permission.DEVICES_VIEW.value,
        Permission.TELEMETRY_VIEW.value,
        Permission.TELEMETRY_EXPORT.value,
        Permission.MODELS_VIEW.value,
        Permission.POLICIES_VIEW.value,
        Permission.COMMANDS_VIEW.value,
        Permission.FAULTS_VIEW.value,
        Permission.FAULTS_ACKNOWLEDGE.value,
        Permission.REPORTS_VIEW.value,
        Permission.REPORTS_EXPORT.value,
        Permission.AUDIT_VIEW.value,
    ],
    CompanyRole.ORGANIZATION_ADMIN.value: [
        Permission.COMPANY_VIEW.value,
        Permission.USERS_VIEW.value,
        Permission.USERS_CREATE.value,
        Permission.USERS_UPDATE.value,
        Permission.SITES_VIEW.value,
        Permission.SITES_CREATE.value,
        Permission.PROJECTS_VIEW.value,
        Permission.PROJECTS_CREATE.value,
        Permission.ASSETS_VIEW.value,
        Permission.DEVICES_VIEW.value,
        Permission.TELEMETRY_VIEW.value,
        Permission.REPORTS_VIEW.value,
    ],
    CompanyRole.SITE_ADMIN.value: [
        Permission.COMPANY_VIEW.value,
        Permission.USERS_VIEW.value,
        Permission.SITES_VIEW.value,
        Permission.PROJECTS_VIEW.value,
        Permission.PROJECTS_CREATE.value,
        Permission.ASSETS_VIEW.value,
        Permission.ASSETS_CREATE.value,
        Permission.DEVICES_VIEW.value,
        Permission.DEVICES_ENROLL.value,
        Permission.DEVICES_CONNECT.value,
        Permission.DEVICES_DISCONNECT.value,
        Permission.TELEMETRY_VIEW.value,
        Permission.COMMANDS_VIEW.value,
        Permission.FAULTS_VIEW.value,
        Permission.FAULTS_ACKNOWLEDGE.value,
        Permission.FAULTS_RESET.value,
        Permission.REPORTS_VIEW.value,
    ],
    CompanyRole.PROJECT_ADMIN.value: [
        Permission.PROJECTS_VIEW.value,
        Permission.PROJECTS_UPDATE.value,
        Permission.ASSETS_VIEW.value,
        Permission.ASSETS_CREATE.value,
        Permission.ASSETS_UPDATE.value,
        Permission.DEVICES_VIEW.value,
        Permission.DEVICES_CONNECT.value,
        Permission.TELEMETRY_VIEW.value,
        Permission.COMMANDS_VIEW.value,
        Permission.COMMANDS_CREATE.value,
        Permission.FAULTS_VIEW.value,
        Permission.FAULTS_ACKNOWLEDGE.value,
        Permission.REPORTS_VIEW.value,
    ],
    CompanyRole.ML_ENGINEER.value: [
        Permission.TELEMETRY_VIEW.value,
        Permission.TELEMETRY_EXPORT.value,
        Permission.MODELS_VIEW.value,
        Permission.MODELS_CREATE.value,
        Permission.MODELS_DEPLOY.value,
        Permission.MODELS_ROLLBACK.value,
        Permission.POLICIES_VIEW.value,
        Permission.POLICIES_CREATE.value,
        Permission.POLICIES_UPDATE.value,
        Permission.REPORTS_VIEW.value,
        Permission.REPORTS_EXPORT.value,
    ],
    CompanyRole.HARDWARE_ENGINEER.value: [
        Permission.DEVICES_VIEW.value,
        Permission.DEVICES_ENROLL.value,
        Permission.DEVICES_CONNECT.value,
        Permission.DEVICES_DISCONNECT.value,
        Permission.ASSETS_VIEW.value,
        Permission.ASSETS_CREATE.value,
        Permission.TELEMETRY_VIEW.value,
        Permission.COMMANDS_VIEW.value,
        Permission.COMMANDS_CREATE.value,
        Permission.COMMANDS_RESET.value,
        Permission.FAULTS_VIEW.value,
        Permission.FAULTS_ACKNOWLEDGE.value,
        Permission.FAULTS_RESET.value,
    ],
    CompanyRole.OPERATOR.value: [
        Permission.ASSETS_VIEW.value,
        Permission.DEVICES_VIEW.value,
        Permission.TELEMETRY_VIEW.value,
        Permission.COMMANDS_VIEW.value,
        Permission.COMMANDS_CREATE.value,
        Permission.COMMANDS_RESET.value,
        Permission.FAULTS_VIEW.value,
        Permission.FAULTS_ACKNOWLEDGE.value,
        Permission.FAULTS_RESET.value,
    ],
    CompanyRole.VIEWER.value: [
        Permission.COMPANY_VIEW.value,
        Permission.SITES_VIEW.value,
        Permission.PROJECTS_VIEW.value,
        Permission.ASSETS_VIEW.value,
        Permission.DEVICES_VIEW.value,
        Permission.TELEMETRY_VIEW.value,
        Permission.MODELS_VIEW.value,
        Permission.POLICIES_VIEW.value,
        Permission.COMMANDS_VIEW.value,
        Permission.FAULTS_VIEW.value,
        Permission.REPORTS_VIEW.value,
    ]
}

def has_permission(user_permissions: Set[str], required_permission: str) -> bool:
    return (
        Permission.COMPANY_DELETE.value in user_permissions # superadmin check
        or "*" in user_permissions 
        or required_permission in user_permissions
    )
