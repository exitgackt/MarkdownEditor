"""
Add 150 test users to the database for testing pagination and filtering.
"""
import sys
import os
from datetime import datetime, timedelta
import random

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import engine
from app.models.user import User

def create_test_users(db: Session, count: int = 150):
    """Create test users with varied data."""

    # Check existing users
    existing_count = db.query(User).count()
    print(f"Existing users: {existing_count}")

    # Japanese first names and last names
    first_names = [
        "太郎", "次郎", "三郎", "花子", "美咲", "翔太", "健太", "大輔", "翔", "拓也",
        "陽菜", "結衣", "さくら", "愛", "美優", "大樹", "隼人", "蓮", "颯太", "悠斗",
        "陽子", "恵子", "明美", "由美", "真由美", "一郎", "二郎", "五郎", "六郎", "七郎"
    ]

    last_names = [
        "佐藤", "鈴木", "高橋", "田中", "渡辺", "伊藤", "山本", "中村", "小林", "加藤",
        "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "斎藤", "清水",
        "森", "池田", "橋本", "山崎", "阿部", "石川", "小川", "前田", "藤田", "岡田"
    ]

    # Create test users
    created = 0
    for i in range(count):
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        name = f"{last_name} {first_name} {i+1}"
        email = f"test-user-{i+1:03d}@example.com"

        # Check if user already exists
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"User {email} already exists, skipping...")
            continue

        # Random last login time (some recent, some old, some never)
        login_choice = random.randint(1, 10)
        if login_choice <= 5:  # 50% logged in recently (last 30 days)
            days_ago = random.randint(0, 30)
            last_login = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23))
        elif login_choice <= 8:  # 30% logged in long ago (31-90 days)
            days_ago = random.randint(31, 90)
            last_login = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23))
        else:  # 20% never logged in
            last_login = None

        # Create user (password is just a placeholder for test users)
        user = User(
            email=email,
            name=name,
            hashed_password="test_password_hash",  # Placeholder - test users won't login
            is_admin=False,  # Don't make them admin
            last_login_at=last_login,
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 365))
        )

        db.add(user)
        created += 1

        if (created % 20) == 0:
            print(f"Created {created} users...")

    db.commit()
    print(f"\nSuccessfully created {created} test users!")
    print(f"Total users in database: {db.query(User).count()}")


if __name__ == "__main__":
    print("Creating 150 test users...")

    with Session(engine) as db:
        try:
            create_test_users(db, 150)
        except Exception as e:
            print(f"Error: {e}")
            db.rollback()
            raise
