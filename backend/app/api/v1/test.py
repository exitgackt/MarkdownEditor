"""
テスト専用APIエンドポイント

警告: このエンドポイントは開発環境専用です。
本番環境では絶対に使用しないでください。
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.core.config import settings
from app.core.security import create_access_token

router = APIRouter()


@router.get("/verify-token/{email}")
def get_verification_token(
    email: str,
    db: Session = Depends(deps.get_db),
):
    """
    E2Eテスト用: メール検証トークンを取得

    開発環境専用のエンドポイントです。
    指定されたメールアドレスのユーザーの検証トークンを返します。
    """
    # 本番環境では使用不可
    if not settings.debug:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only available in development mode"
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not user.email_verification_token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No verification token found for this user"
        )

    return {"token": user.email_verification_token}


@router.get("/reset-token/{email}")
def get_reset_token(
    email: str,
    db: Session = Depends(deps.get_db),
):
    """
    E2Eテスト用: パスワードリセットトークンを取得

    開発環境専用のエンドポイントです。
    指定されたメールアドレスのユーザーのリセットトークンを返します。
    """
    # 本番環境では使用不可
    if not settings.debug:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only available in development mode"
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not user.password_reset_token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No reset token found for this user"
        )

    return {"token": user.password_reset_token}


@router.post("/mock-google-login")
def mock_google_login(
    request: dict,
    db: Session = Depends(deps.get_db),
):
    """
    E2Eテスト用: モックGoogle OAuthログイン

    開発環境専用のエンドポイントです。
    Google OAuthをモックして、テストユーザーのJWTトークンを返します。
    """
    # 本番環境では使用不可
    if not settings.debug:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only available in development mode"
        )

    email = request.get("email")
    name = request.get("name")

    if not email or not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and name are required"
        )

    # ユーザーが存在するか確認
    user = db.query(User).filter(User.email == email).first()

    # 存在しない場合は作成
    if not user:
        user = User(
            email=email,
            name=name,
            email_verified=True,
            auth_provider="google",
            hashed_password=None,  # OAuth ユーザーはパスワードなし
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # JWTトークンを生成
    access_token = create_access_token(data={"sub": user.email})

    return {"token": access_token}
