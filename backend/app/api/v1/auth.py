"""
Authentication API endpoints.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import (
    GoogleLoginRequest,
    RegisterRequest,
    LoginRequest,
    RegisterResponse,
    VerifyEmailRequest,
    ResendVerificationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    AuthSettingsResponse,
    TokenResponse,
    UserResponse,
    VerifyTokenResponse,
)
from app.services.auth_service import auth_service
from app.services.email_service import email_service
from app.services.admin_service import admin_service
from app.core.rate_limit import rate_limiter
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/settings", response_model=AuthSettingsResponse)
def get_auth_settings(db: Session = Depends(get_db)):
    """
    Get authentication settings (public endpoint).

    Returns:
        Authentication settings including enabled auth methods
    """
    auth_settings = admin_service.get_setting(db, "auth_settings")

    if not auth_settings:
        # Default settings: email only
        auth_mode = "email"
    else:
        auth_mode = auth_settings.get("mode", "email")

    return AuthSettingsResponse(
        auth_mode=auth_mode,
        google_enabled=auth_mode in ["google", "both"],
        email_enabled=auth_mode in ["email", "both"],
    )


@router.post("/register", response_model=RegisterResponse)
async def register(
    request: RegisterRequest,
    http_request: Request,
    db: Session = Depends(get_db),
):
    """
    Register a new user with email and password.

    Args:
        request: Registration request with email, password, and name
        http_request: HTTP request object
        db: Database session

    Returns:
        Success message with email
    """
    # Check rate limit
    rate_limiter.check_registration_rate_limit(http_request)

    # Check if email auth is enabled
    auth_settings_response = get_auth_settings(db)
    if not auth_settings_response.email_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="メール・パスワード認証は現在無効です"
        )

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="このメールアドレスは既に登録されています"
        )

    # Get password policy settings
    auth_settings = admin_service.get_setting(db, "auth_settings")
    password_settings = auth_settings if auth_settings else {}

    # Validate password strength
    is_valid, error_msg = auth_service.validate_password_strength(
        request.password, password_settings
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )

    # Hash password
    hashed_password = auth_service.hash_password(request.password)

    # Generate verification token
    verification_token = auth_service.generate_verification_token()

    # Create user
    user = User(
        email=request.email,
        name=request.name,
        hashed_password=hashed_password,
        auth_provider="email",
        email_verified=False,
        email_verification_token=verification_token,
        is_admin=request.email in settings.admin_emails_list,
    )
    db.add(user)
    db.commit()

    # Send verification email
    await email_service.send_verification_email(request.email, verification_token)

    return RegisterResponse(
        message="登録が完了しました。メールに送信された確認リンクをクリックしてください。",
        email=request.email
    )


@router.post("/login", response_model=TokenResponse)
def login_with_email(
    login_request: LoginRequest,
    http_request: Request,
    db: Session = Depends(get_db),
):
    """
    Login with email and password.

    Args:
        login_request: Login request with email and password
        http_request: HTTP request object
        db: Database session

    Returns:
        JWT access token and user information
    """
    # Check rate limit
    rate_limiter.check_login_rate_limit(http_request)

    # Check if email auth is enabled
    auth_settings_response = get_auth_settings(db)
    if not auth_settings_response.email_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="メール・パスワード認証は現在無効です"
        )

    # Find user by email
    user = db.query(User).filter(User.email == login_request.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません"
        )

    # Verify password
    if not auth_service.verify_password(login_request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません"
        )

    # Check email verification
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="メールアドレスが未確認です。確認メールを確認してください。"
        )

    # Update last login time
    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    # Record login history
    ip_address = http_request.client.host if http_request.client else None
    admin_service.record_login(db, user.id, ip_address)

    # Reset rate limit on successful login
    if http_request.client:
        rate_limiter.reset_login_attempts(http_request.client.host)

    # Create JWT token
    access_token = create_access_token(data={"sub": user.email})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/verify-email")
def verify_email(
    request: VerifyEmailRequest,
    db: Session = Depends(get_db),
):
    """
    Verify email address with token.

    Args:
        request: Email verification request with token
        db: Database session

    Returns:
        Success message
    """
    user = db.query(User).filter(
        User.email_verification_token == request.token
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効な確認トークンです"
        )

    # Mark email as verified
    user.email_verified = True
    user.email_verification_token = None
    db.commit()

    return {"message": "メールアドレスが確認されました。ログインできます。"}


@router.post("/resend-verification")
async def resend_verification(
    request: ResendVerificationRequest,
    db: Session = Depends(get_db),
):
    """
    Resend email verification link.

    Args:
        request: Resend request with email
        db: Database session

    Returns:
        Success message
    """
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        # Don't reveal if email exists
        return {"message": "確認メールを送信しました"}

    if user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="このメールアドレスは既に確認済みです"
        )

    # Generate new verification token
    verification_token = auth_service.generate_verification_token()
    user.email_verification_token = verification_token
    db.commit()

    # Send verification email
    await email_service.send_verification_email(request.email, verification_token)

    return {"message": "確認メールを再送信しました"}


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Request password reset.

    Args:
        request: Forgot password request with email
        db: Database session

    Returns:
        Success message
    """
    user = db.query(User).filter(User.email == request.email).first()

    if not user or not user.hashed_password:
        # Don't reveal if email exists
        return {"message": "パスワードリセットメールを送信しました"}

    # Generate password reset token
    reset_token, expires = auth_service.generate_password_reset_token()
    user.password_reset_token = reset_token
    user.password_reset_expires = expires
    db.commit()

    # Send password reset email
    await email_service.send_password_reset_email(request.email, reset_token)

    return {"message": "パスワードリセットメールを送信しました"}


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Reset password with token.

    Args:
        request: Reset password request with token and new password
        db: Database session

    Returns:
        Success message
    """
    user = db.query(User).filter(
        User.password_reset_token == request.token
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効なリセットトークンです"
        )

    # Check if token expired
    if user.password_reset_expires and user.password_reset_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="リセットトークンの有効期限が切れています"
        )

    # Get password policy settings
    auth_settings = admin_service.get_setting(db, "auth_settings")
    password_settings = auth_settings if auth_settings else {}

    # Validate password strength
    is_valid, error_msg = auth_service.validate_password_strength(
        request.new_password, password_settings
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )

    # Hash new password
    user.hashed_password = auth_service.hash_password(request.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()

    return {"message": "パスワードがリセットされました"}


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Change password for authenticated user.

    Args:
        request: Change password request with current and new password
        current_user: Current authenticated user
        db: Database session

    Returns:
        Success message
    """
    if not current_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="このアカウントはパスワード認証を使用していません"
        )

    # Verify current password
    if not auth_service.verify_password(
        request.current_password, current_user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="現在のパスワードが正しくありません"
        )

    # Get password policy settings
    auth_settings = admin_service.get_setting(db, "auth_settings")
    password_settings = auth_settings if auth_settings else {}

    # Validate new password strength
    is_valid, error_msg = auth_service.validate_password_strength(
        request.new_password, password_settings
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )

    # Hash and update password
    current_user.hashed_password = auth_service.hash_password(request.new_password)
    db.commit()

    return {"message": "パスワードが変更されました"}


@router.post("/google/login", response_model=TokenResponse)
def login_with_google(
    login_request: GoogleLoginRequest,
    http_request: Request,
    db: Session = Depends(get_db),
):
    """
    Login or register user with Google OAuth token.

    Args:
        login_request: Google login request with ID token
        http_request: HTTP request object for IP address
        db: Database session

    Returns:
        JWT access token and user information
    """
    # Verify Google token
    google_user_info = auth_service.verify_google_token(login_request.token)

    # Check if user exists
    user = db.query(User).filter(User.google_id == google_user_info["google_id"]).first()

    if user:
        # Update last login time
        user.last_login_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
    else:
        # Create new user
        is_admin = google_user_info["email"] in settings.admin_emails_list
        user = User(
            email=google_user_info["email"],
            name=google_user_info["name"],
            google_id=google_user_info["google_id"],
            auth_provider="google",
            email_verified=True,  # Google emails are pre-verified
            is_admin=is_admin,
            last_login_at=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Record login history
    ip_address = http_request.client.host if http_request.client else None
    admin_service.record_login(db, user.id, ip_address)

    # Create JWT token
    access_token = create_access_token(data={"sub": user.email})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """
    Get current authenticated user information.

    Args:
        current_user: Current authenticated user from JWT

    Returns:
        User information
    """
    return UserResponse.model_validate(current_user)


@router.post("/verify", response_model=VerifyTokenResponse)
def verify_token(
    current_user: User = Depends(get_current_user),
):
    """
    Verify JWT token and return user information.

    Args:
        current_user: Current authenticated user from JWT

    Returns:
        User information if token is valid
    """
    return VerifyTokenResponse(user=UserResponse.model_validate(current_user))


@router.post("/accept-terms", response_model=UserResponse)
def accept_terms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Accept terms of service for the current user.

    Args:
        current_user: Current authenticated user from JWT
        db: Database session

    Returns:
        Updated user information with terms_accepted=True
    """
    # Update terms_accepted fields
    current_user.terms_accepted = True
    current_user.terms_accepted_at = datetime.utcnow()

    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)
