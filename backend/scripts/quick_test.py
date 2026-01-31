#!/usr/bin/env python3
"""
クイックテストスクリプト - 認証システムの動作確認

使用方法:
    cd backend
    source venv/bin/activate
    python scripts/quick_test.py
"""

import sys
import os

# パスの設定
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User
from app.services.auth_service import auth_service
from sqlalchemy import func
import uuid

def print_section(title):
    """セクションタイトルを表示"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def test_password_hashing():
    """パスワードハッシュ化のテスト"""
    print_section("パスワードハッシュ化テスト")

    password = "TestPassword123"
    print(f"元のパスワード: {password}")

    # ハッシュ化
    hashed = auth_service.hash_password(password)
    print(f"ハッシュ化: {hashed[:50]}...")

    # 検証
    is_valid = auth_service.verify_password(password, hashed)
    print(f"検証結果: {'✓ 成功' if is_valid else '✗ 失敗'}")

    # 誤ったパスワードでの検証
    is_invalid = auth_service.verify_password("WrongPassword", hashed)
    print(f"誤パスワード検証: {'✓ 正しく拒否' if not is_invalid else '✗ 誤って許可'}")

def test_password_validation():
    """パスワード強度検証のテスト"""
    print_section("パスワード強度検証テスト")

    test_cases = [
        ("Test123", True, "有効なパスワード"),
        ("test", False, "短すぎる"),
        ("testtest", False, "大文字なし"),
        ("TESTTEST", False, "小文字なし"),
        ("TestTest", False, "数字なし"),
    ]

    for password, should_pass, description in test_cases:
        is_valid, error_msg = auth_service.validate_password_strength(password)
        status = "✓" if is_valid == should_pass else "✗"
        print(f"{status} {description}: {password}")
        if error_msg:
            print(f"   → {error_msg}")

def test_token_generation():
    """トークン生成のテスト"""
    print_section("トークン生成テスト")

    # メール検証トークン
    verification_token = auth_service.generate_verification_token()
    print(f"メール検証トークン: {verification_token[:30]}...")
    print(f"長さ: {len(verification_token)} 文字")

    # パスワードリセットトークン
    reset_token, expires = auth_service.generate_password_reset_token()
    print(f"\nパスワードリセットトークン: {reset_token[:30]}...")
    print(f"有効期限: {expires}")
    print(f"有効期限（相対）: {expires.strftime('%Y-%m-%d %H:%M:%S UTC')}")

def show_database_status():
    """データベースの状態を表示"""
    print_section("データベース状態")

    db = SessionLocal()
    try:
        # ユーザー数
        total_users = db.query(func.count(User.id)).scalar()
        print(f"総ユーザー数: {total_users}")

        # 認証方式別
        email_users = db.query(func.count(User.id)).filter(
            User.auth_provider == 'email'
        ).scalar()
        google_users = db.query(func.count(User.id)).filter(
            User.auth_provider == 'google'
        ).scalar()

        print(f"  メール認証: {email_users}")
        print(f"  Google認証: {google_users}")

        # メール検証状態
        verified = db.query(func.count(User.id)).filter(
            User.email_verified == True
        ).scalar()
        unverified = db.query(func.count(User.id)).filter(
            User.email_verified == False
        ).scalar()

        print(f"\nメール検証状態:")
        print(f"  検証済み: {verified}")
        print(f"  未検証: {unverified}")

        # 管理者数
        admin_count = db.query(func.count(User.id)).filter(
            User.is_admin == True
        ).scalar()
        print(f"\n管理者数: {admin_count}")

        # 最新ユーザー
        print("\n最新ユーザー（5件）:")
        recent_users = db.query(User).order_by(User.created_at.desc()).limit(5).all()
        for user in recent_users:
            print(f"  - {user.email} ({user.auth_provider}, "
                  f"検証: {'済' if user.email_verified else '未'}, "
                  f"管理者: {'Yes' if user.is_admin else 'No'})")

    finally:
        db.close()

def create_test_user():
    """テストユーザーを作成"""
    print_section("テストユーザー作成")

    db = SessionLocal()
    try:
        test_email = "quicktest@example.com"

        # 既存ユーザーを確認
        existing = db.query(User).filter(User.email == test_email).first()
        if existing:
            print(f"✓ テストユーザーは既に存在します: {test_email}")
            print(f"  作成日時: {existing.created_at}")
            print(f"  検証状態: {'済' if existing.email_verified else '未'}")
            return

        # 新規作成
        test_password = "QuickTest123"
        hashed_password = auth_service.hash_password(test_password)
        verification_token = auth_service.generate_verification_token()

        test_user = User(
            id=uuid.uuid4(),
            email=test_email,
            name="Quick Test User",
            hashed_password=hashed_password,
            auth_provider="email",
            email_verified=False,
            email_verification_token=verification_token,
            is_admin=False,
        )

        db.add(test_user)
        db.commit()

        print(f"✓ テストユーザーを作成しました")
        print(f"  メール: {test_email}")
        print(f"  パスワード: {test_password}")
        print(f"  検証トークン: {verification_token}")
        print(f"\n  検証URL:")
        print(f"  http://localhost:5173/verify-email?token={verification_token}")

    except Exception as e:
        print(f"✗ エラー: {e}")
        db.rollback()
    finally:
        db.close()

def run_all_tests():
    """すべてのテストを実行"""
    print("\n")
    print("╔" + "═" * 58 + "╗")
    print("║" + " " * 10 + "認証システム クイックテスト" + " " * 20 + "║")
    print("╚" + "═" * 58 + "╝")

    try:
        test_password_hashing()
        test_password_validation()
        test_token_generation()
        show_database_status()
        create_test_user()

        print_section("テスト完了")
        print("✓ すべてのテストが完了しました")
        print("\n次のステップ:")
        print("  1. http://localhost:5173 でフロントエンドにアクセス")
        print("  2. テストユーザーでログインを試す")
        print("  3. TESTING_GUIDE.md の詳細なテストシナリオを実行")

    except Exception as e:
        print(f"\n✗ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_all_tests()
