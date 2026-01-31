"""
Pydantic schemas for authentication endpoints.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, UUID4, Field, validator


class GoogleLoginRequest(BaseModel):
    """Request schema for Google OAuth login."""

    token: str


class RegisterRequest(BaseModel):
    """Request schema for email/password registration."""

    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1)


class LoginRequest(BaseModel):
    """Request schema for email/password login."""

    email: EmailStr
    password: str


class RegisterResponse(BaseModel):
    """Response schema for registration."""

    message: str
    email: EmailStr


class VerifyEmailRequest(BaseModel):
    """Request schema for email verification."""

    token: str


class ResendVerificationRequest(BaseModel):
    """Request schema for resending verification email."""

    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    """Request schema for password reset request."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Request schema for password reset."""

    token: str
    new_password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    """Request schema for password change."""

    current_password: str
    new_password: str = Field(..., min_length=8)


class AuthSettingsResponse(BaseModel):
    """Response schema for authentication settings."""

    auth_mode: str  # "email", "google", "both"
    google_enabled: bool
    email_enabled: bool


class UserResponse(BaseModel):
    """Response schema for user data."""

    id: UUID4
    email: EmailStr
    name: str
    google_id: Optional[str] = None  # Now nullable
    auth_provider: str  # "email", "google", "both"
    email_verified: bool
    is_admin: bool
    terms_accepted: bool
    terms_accepted_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Response schema for authentication token."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class VerifyTokenResponse(BaseModel):
    """Response schema for token verification."""

    user: UserResponse
