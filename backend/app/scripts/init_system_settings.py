"""
Initialize system settings with default values.

This script creates default system settings if they don't exist.
"""
import sys
import uuid
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.core.database import SessionLocal
from app.models.system_settings import SystemSettings


# Default settings
DEFAULT_SETTINGS = {
    "browser_guide": """## 推奨ブラウザ

このアプリケーションは以下のブラウザで最適に動作します：

- Google Chrome (最新版)
- Microsoft Edge (最新版)
- Safari (最新版)

**注意**: File System Access API を使用するため、Chrome/Edge での利用を推奨します。""",

    "maintenance": "false",

    "terms": """# 利用規約

## 第1条（適用）
本規約は、本サービスの利用条件を定めるものです。

## 第2条（利用登録）
本サービスの利用を希望する方は、本規約に同意の上、当社の定める方法によって利用登録を申請してください。

## 第3条（禁止事項）
ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
1. 法令または公序良俗に違反する行為
2. 犯罪行為に関連する行為
3. 本サービスの内容等を改ざんする行為

## 第4条（本サービスの提供の停止等）
当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができます。

## 第5条（免責事項）
当社は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。

最終更新日: 2026-01-29""",
}


def init_system_settings():
    """Initialize system settings with default values."""
    db = SessionLocal()

    print("=" * 60)
    print("INITIALIZE SYSTEM SETTINGS")
    print("=" * 60)
    print()

    try:
        created_count = 0
        existing_count = 0

        for key, default_value in DEFAULT_SETTINGS.items():
            # Check if setting already exists
            existing = db.query(SystemSettings).filter(
                SystemSettings.key == key
            ).first()

            if existing:
                print(f"✓ Setting '{key}' already exists")
                existing_count += 1
            else:
                # Create new setting
                setting = SystemSettings(
                    id=str(uuid.uuid4()),
                    key=key,
                    value=default_value,
                    updated_by_user_id=None,
                    version="1.0",
                )
                db.add(setting)
                db.commit()
                print(f"✅ Created setting '{key}'")
                created_count += 1

        print()
        print("=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"Created: {created_count}")
        print(f"Already existing: {existing_count}")
        print(f"Total: {created_count + existing_count}")
        print()

        if created_count > 0:
            print("✅ System settings initialized successfully!")
        else:
            print("ℹ️  All settings already exist. No changes made.")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_system_settings()
