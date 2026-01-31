"""
API v1 router configuration.
"""
from fastapi import APIRouter

from app.api.v1 import auth, admin_usage, admin_settings, admin_users, test

api_router = APIRouter()

# Include authentication routes
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Include admin routes
api_router.include_router(admin_usage.router, prefix="/admin/usage", tags=["Admin - Usage"])
api_router.include_router(admin_settings.router, prefix="/admin/settings", tags=["Admin - Settings"])
api_router.include_router(admin_users.router, prefix="/admin", tags=["Admin - Users"])

# Include test routes (development only)
api_router.include_router(test.router, prefix="/test", tags=["Test"])
