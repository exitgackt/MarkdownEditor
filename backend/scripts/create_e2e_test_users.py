"""
E2Eテスト用のテストユーザーを作成するスクリプト

このスクリプトはE2Eテストで使用する以下のユーザーを作成します:
1. test@example.com (一般ユーザー, パスワード: Test1234!)
2. admin@example.com (管理者ユーザー, パスワード: Admin1234!)
3. fulltest-admin@example.com (完全テスト管理者, パスワード: Admin1234!)
"""
import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import engine
from app.models.user import User
from app.models.admin_user import AdminUser
from passlib.context import CryptContext
import uuid

# パスワードハッシュ化
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_e2e_test_users(db: Session):
    """E2Eテスト用ユーザーを作成"""

    users_to_create = [
        {
            "email": "test@example.com",
            "name": "Test User",
            "password": "Test1234!",
            "is_admin": False,
        },
        {
            "email": "admin@example.com",
            "name": "Admin User",
            "password": "Admin1234!",
            "is_admin": True,
        },
        {
            "email": "fulltest-admin@example.com",
            "name": "Full Test Admin",
            "password": "Admin1234!",
            "is_admin": True,
        },
        {
            "email": "password-reset-test@example.com",
            "name": "Password Reset Test User",
            "password": "Reset1234!",
            "is_admin": False,
        },
    ]

    created = 0
    updated = 0

    for user_data in users_to_create:
        email = user_data["email"]

        # 既存ユーザーを確認
        existing_user = db.query(User).filter(User.email == email).first()

        if existing_user:
            # 既存ユーザーを強制的に更新（パスワードを正しいものに設定）
            print(f"Updating existing user: {email}")
            existing_user.hashed_password = pwd_context.hash(user_data["password"])
            existing_user.auth_provider = "email"
            existing_user.email_verified = True
            existing_user.is_admin = user_data["is_admin"]
            existing_user.terms_accepted = True
            updated += 1
        else:
            # 新規ユーザー作成
            print(f"Creating new user: {email}")
            user = User(
                email=email,
                name=user_data["name"],
                hashed_password=pwd_context.hash(user_data["password"]),
                auth_provider="email",
                email_verified=True,
                is_admin=user_data["is_admin"],
                terms_accepted=True,
            )
            db.add(user)
            created += 1

    db.commit()

    # 管理者ユーザーをadmin_usersテーブルに追加
    admin_added = 0
    for user_data in users_to_create:
        if user_data["is_admin"]:
            user = db.query(User).filter(User.email == user_data["email"]).first()
            if user:
                # admin_usersテーブルに既に存在するか確認
                existing_admin = db.query(AdminUser).filter(AdminUser.user_id == user.id).first()
                if not existing_admin:
                    admin_user = AdminUser(
                        id=str(uuid.uuid4()),
                        user_id=user.id,
                        added_by_user_id=user.id,
                    )
                    db.add(admin_user)
                    admin_added += 1
                    print(f"Added {user.email} to admin_users table")

    db.commit()

    print(f"\n✅ E2Eテストユーザー作成完了:")
    print(f"   - 新規作成: {created}ユーザー")
    print(f"   - 更新: {updated}ユーザー")
    print(f"   - admin_users追加: {admin_added}ユーザー")
    print(f"\nログイン情報:")
    print(f"   一般ユーザー:")
    print(f"     Email: test@example.com")
    print(f"     Password: Test1234!")
    print(f"   管理者ユーザー:")
    print(f"     Email: admin@example.com")
    print(f"     Password: Admin1234!")
    print(f"   完全テスト管理者:")
    print(f"     Email: fulltest-admin@example.com")
    print(f"     Password: Admin1234!")


if __name__ == "__main__":
    print("E2Eテスト用ユーザーを作成中...")

    with Session(engine) as db:
        try:
            create_e2e_test_users(db)
        except Exception as e:
            print(f"❌ エラー: {e}")
            db.rollback()
            raise
