import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.base import Base
from app.database.session import engine
import app.models # Register models
from app.services.execution_service import execution_service

# Routers
from app.api.auth import router as auth_router
from app.api.companies import router as companies_router
from app.api.organizations import router as org_router
from app.api.users import router as users_router
from app.api.roles import router as roles_router
from app.api.operations import router as ops_router
from app.api.devices import router as devices_router
from app.api.telemetry import router as telemetry_router
from app.api.runs import router as runs_router
from app.api.models import router as models_router
from app.api.policies import router as policies_router
from app.api.commands import router as commands_router
from app.api.faults import router as faults_router
from app.api.events import router as events_router
from app.api.reports import router as reports_router
from app.api.acceptance import router as acceptance_router
from app.api.system_health import router as health_router
from app.api.ws import router as ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist & start background pipeline
    Base.metadata.create_all(bind=engine)
    await execution_service.start_pipeline()
    yield
    # Shutdown
    await execution_service.stop_pipeline()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise Multi-Tenant B2B AI + IoT Hardware Monitoring & Safety Control Platform",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
v1 = settings.API_V1_PREFIX
app.include_router(auth_router, prefix=v1)
app.include_router(companies_router, prefix=v1)
app.include_router(org_router, prefix=v1)
app.include_router(users_router, prefix=v1)
app.include_router(roles_router, prefix=v1)
app.include_router(ops_router, prefix=v1)
app.include_router(devices_router, prefix=v1)
app.include_router(telemetry_router, prefix=v1)
app.include_router(runs_router, prefix=v1)
app.include_router(models_router, prefix=v1)
app.include_router(policies_router, prefix=v1)
app.include_router(commands_router, prefix=v1)
app.include_router(faults_router, prefix=v1)
app.include_router(events_router, prefix=v1)
app.include_router(reports_router, prefix=v1)
app.include_router(acceptance_router, prefix=v1)
app.include_router(health_router, prefix=v1)
app.include_router(ws_router) # /ws/live

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV
    }
