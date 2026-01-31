"""
Pydantic schemas for admin endpoints.
"""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, UUID4, Field


# Usage Stats Schemas
class UsageStatsResponse(BaseModel):
    """Response schema for usage statistics."""

    date: date
    total_users: int
    active_users: int
    new_users: int
    total_logins: int

    class Config:
        from_attributes = True


class UsageSummaryResponse(BaseModel):
    """Response schema for usage summary."""

    total_users: int
    active_users_today: int
    new_users_today: int
    total_logins_today: int


# System Settings Schemas
class SystemSettingsResponse(BaseModel):
    """Response schema for system settings."""

    key: str
    value: str
    updated_at: Optional[datetime] = None
    version: Optional[str] = None

    class Config:
        from_attributes = True


class SystemSettingsUpdateRequest(BaseModel):
    """Request schema for updating system settings."""

    value: str
    version: Optional[str] = None


class AuthSettingsResponse(BaseModel):
    """Response schema for authentication settings."""

    mode: str  # "email", "google", "both"
    email_verification_required: bool
    password_min_length: int
    password_require_uppercase: bool
    password_require_lowercase: bool
    password_require_number: bool
    password_require_special: bool


class AuthSettingsUpdateRequest(BaseModel):
    """Request schema for updating authentication settings."""

    mode: str  # "email", "google", "both"
    email_verification_required: Optional[bool] = True
    password_min_length: Optional[int] = 8
    password_require_uppercase: Optional[bool] = True
    password_require_lowercase: Optional[bool] = True
    password_require_number: Optional[bool] = True
    password_require_special: Optional[bool] = False


# User Management Schemas
class UserListItem(BaseModel):
    """Response schema for user list item."""

    id: UUID4
    email: str
    name: str
    is_admin: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Response schema for paginated user list."""

    users: List[UserListItem]
    total: int
    page: int
    limit: int
    pages: int


# Admin User Management Schemas
class AdminUserResponse(BaseModel):
    """Response schema for admin user."""

    id: UUID4
    user_id: UUID4
    email: str
    name: str
    added_at: datetime
    added_by_email: Optional[str] = None
    isSelf: Optional[bool] = False


class AdminUserAddRequest(BaseModel):
    """Request schema for adding admin user."""

    email: str


# Login History Schemas
class LoginHistoryResponse(BaseModel):
    """Response schema for login history."""

    id: UUID4
    user_id: UUID4
    logged_in_at: datetime
    ip_address: Optional[str] = None

    class Config:
        from_attributes = True


# User Detail Schemas (for Phase 11 simplified version)
class UserDetailResponse(BaseModel):
    """Response schema for user detail with plan and status."""

    id: UUID4
    email: str
    name: str
    is_admin: bool
    plan: str  # "free", "monthly", "yearly"
    status: str  # "active", "suspended"
    last_login_at: Optional[datetime] = Field(None, serialization_alias='lastLoginAt')
    created_at: datetime = Field(serialization_alias='createdAt')

    class Config:
        from_attributes = True
        populate_by_name = True


class UserDetailListResponse(BaseModel):
    """Response schema for paginated user detail list."""

    users: List[UserDetailResponse]
    total: int
    page: int
    limit: int
    pages: int


class UpdateUserStatusRequest(BaseModel):
    """Request schema for updating user status."""

    status: str  # "active" or "suspended"
