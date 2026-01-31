"""
Admin system settings API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.admin import (
    SystemSettingsResponse,
    SystemSettingsUpdateRequest,
    AuthSettingsResponse,
    AuthSettingsUpdateRequest,
)
from app.services.admin_service import admin_service
from app.api.deps import require_admin

router = APIRouter()


@router.get("/browser-guide", response_model=SystemSettingsResponse)
def get_browser_guide(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get browser guide settings.

    Requires admin privileges.
    """
    setting = admin_service.get_system_setting(
        db, admin_service.SETTINGS_BROWSER_GUIDE
    )
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Browser guide settings not found",
        )
    return SystemSettingsResponse.model_validate(setting)


@router.put("/browser-guide", response_model=SystemSettingsResponse)
def update_browser_guide(
    request: SystemSettingsUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Update browser guide settings.

    Requires admin privileges.
    """
    setting = admin_service.update_system_setting(
        db,
        admin_service.SETTINGS_BROWSER_GUIDE,
        request.value,
        current_user.id,
        request.version,
    )
    return SystemSettingsResponse.model_validate(setting)


@router.get("/terms", response_model=SystemSettingsResponse)
def get_terms(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get terms of service settings.

    Requires admin privileges.
    """
    setting = admin_service.get_system_setting(db, admin_service.SETTINGS_TERMS)
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Terms of service settings not found",
        )
    return SystemSettingsResponse.model_validate(setting)


@router.put("/terms", response_model=SystemSettingsResponse)
def update_terms(
    request: SystemSettingsUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Update terms of service settings.

    Requires admin privileges.
    """
    setting = admin_service.update_system_setting(
        db,
        admin_service.SETTINGS_TERMS,
        request.value,
        current_user.id,
        request.version,
    )
    return SystemSettingsResponse.model_validate(setting)


@router.get("/maintenance", response_model=SystemSettingsResponse)
def get_maintenance(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get maintenance mode settings.

    Requires admin privileges.
    """
    setting = admin_service.get_system_setting(
        db, admin_service.SETTINGS_MAINTENANCE
    )
    if not setting:
        # Return default maintenance mode (disabled)
        return SystemSettingsResponse(
            key=admin_service.SETTINGS_MAINTENANCE,
            value="false",
            updated_at=None,
            version=None,
        )
    return SystemSettingsResponse.model_validate(setting)


@router.put("/maintenance", response_model=SystemSettingsResponse)
def update_maintenance(
    request: SystemSettingsUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Update maintenance mode settings.

    Requires admin privileges.
    """
    setting = admin_service.update_system_setting(
        db,
        admin_service.SETTINGS_MAINTENANCE,
        request.value,
        current_user.id,
        request.version,
    )
    return SystemSettingsResponse.model_validate(setting)


@router.get("/auth", response_model=AuthSettingsResponse)
def get_auth_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get authentication settings.

    Requires admin privileges.
    """
    settings = admin_service.get_setting(db, admin_service.SETTINGS_AUTH)
    if not settings:
        settings = admin_service.DEFAULT_AUTH_SETTINGS

    return AuthSettingsResponse(**settings)


@router.put("/auth", response_model=AuthSettingsResponse)
def update_auth_settings(
    request: AuthSettingsUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Update authentication settings.

    Requires admin privileges.
    """
    # Validate mode
    if request.mode not in ["email", "google", "both"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid auth mode. Must be 'email', 'google', or 'both'",
        )

    # Validate password requirements
    if request.password_min_length < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password minimum length must be at least 6 characters",
        )

    # Build settings dictionary
    settings_dict = {
        "mode": request.mode,
        "email_verification_required": request.email_verification_required,
        "password_min_length": request.password_min_length,
        "password_require_uppercase": request.password_require_uppercase,
        "password_require_lowercase": request.password_require_lowercase,
        "password_require_number": request.password_require_number,
        "password_require_special": request.password_require_special,
    }

    # Update settings
    admin_service.update_setting(
        db, admin_service.SETTINGS_AUTH, settings_dict, current_user.id
    )

    return AuthSettingsResponse(**settings_dict)
