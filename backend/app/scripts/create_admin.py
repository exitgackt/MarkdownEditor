"""
Script to create or manage admin users in the database.
Usage: python -m app.scripts.create_admin [--check | --create-test | --add-email <email>]
"""
import sys
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.user import User
from app.models.admin_user import AdminUser


def check_admin_users(db: Session) -> None:
    """Check if admin users exist in the database."""
    admin_users = db.query(User).filter(User.is_admin == True).all()

    print("\n" + "="*60)
    print("ADMIN USERS CHECK")
    print("="*60)

    if not admin_users:
        print("\nNo admin users found in the database.")
        print(f"Initial admin emails from config: {', '.join(settings.admin_emails_list)}")
    else:
        print(f"\nFound {len(admin_users)} admin user(s):\n")
        for user in admin_users:
            admin_record = db.query(AdminUser).filter(AdminUser.user_id == user.id).first()
            added_at = admin_record.added_at if admin_record else "N/A"
            print(f"  Email: {user.email}")
            print(f"  ID: {user.id}")
            print(f"  Name: {user.name}")
            print(f"  Google ID: {user.google_id}")
            print(f"  Added at: {added_at}")
            print()


def create_test_admin(db: Session) -> None:
    """Create a test admin user."""
    print("\n" + "="*60)
    print("CREATE TEST ADMIN USER")
    print("="*60)

    # Check if test user already exists
    test_email = "test-admin@example.com"
    existing_user = db.query(User).filter(User.email == test_email).first()

    if existing_user:
        print(f"\nTest user '{test_email}' already exists.")
        if existing_user.is_admin:
            print("User is already an admin.")
        else:
            print("User exists but is not an admin. Promoting to admin...")
            existing_user.is_admin = True
            admin_user = AdminUser(
                id=uuid.uuid4(),
                user_id=existing_user.id,
                added_by_user_id=None,  # No creator for initial setup
            )
            db.add(admin_user)
            db.commit()
            print("User promoted to admin successfully.")
        return

    # Create new test admin user
    test_user = User(
        id=uuid.uuid4(),
        email=test_email,
        name="Test Admin",
        google_id=f"test-google-id-{uuid.uuid4()}",
        is_admin=True,
        created_at=datetime.utcnow(),
    )
    db.add(test_user)
    db.flush()

    # Create admin user record
    admin_user = AdminUser(
        id=uuid.uuid4(),
        user_id=test_user.id,
        added_by_user_id=None,  # No creator for initial setup
    )
    db.add(admin_user)
    db.commit()

    print(f"\nTest admin user created successfully!")
    print(f"  Email: {test_email}")
    print(f"  ID: {test_user.id}")
    print(f"  Name: Test Admin")
    print(f"\nYou can use this account to log in and manage other admins.")


def add_admin_user_by_email(db: Session, email: str) -> None:
    """Promote an existing user to admin by email."""
    print("\n" + "="*60)
    print("ADD ADMIN USER")
    print("="*60)

    # Find user by email
    user = db.query(User).filter(User.email == email).first()

    if not user:
        print(f"\nError: User with email '{email}' not found in the database.")
        print("Please ensure the user has logged in at least once.")
        return

    if user.is_admin:
        print(f"\nUser '{email}' is already an admin.")
        return

    # Check if admin record exists
    admin_record = db.query(AdminUser).filter(AdminUser.user_id == user.id).first()
    if admin_record:
        print(f"\nUser '{email}' already has an admin record.")
        return

    # Promote user to admin
    user.is_admin = True
    admin_user = AdminUser(
        id=uuid.uuid4(),
        user_id=user.id,
        added_by_user_id=None,  # No creator for initial setup
    )
    db.add(admin_user)
    db.commit()

    print(f"\nUser '{email}' promoted to admin successfully!")
    print(f"  ID: {user.id}")
    print(f"  Name: {user.name}")


def show_help() -> None:
    """Show help message."""
    print("\n" + "="*60)
    print("ADMIN USER MANAGEMENT")
    print("="*60)
    print("\nUsage: python -m app.scripts.create_admin [COMMAND]\n")
    print("Commands:")
    print("  --check              Check admin users in database (default)")
    print("  --create-test        Create a test admin user")
    print("  --add-email <EMAIL>  Promote existing user to admin by email")
    print("  --help               Show this help message\n")
    print("Examples:")
    print("  python -m app.scripts.create_admin")
    print("  python -m app.scripts.create_admin --check")
    print("  python -m app.scripts.create_admin --create-test")
    print("  python -m app.scripts.create_admin --add-email user@example.com\n")


def main():
    """Main entry point."""
    db = SessionLocal()

    try:
        if len(sys.argv) < 2:
            # Default: check admin users
            check_admin_users(db)
        elif sys.argv[1] == "--check":
            check_admin_users(db)
        elif sys.argv[1] == "--create-test":
            create_test_admin(db)
        elif sys.argv[1] == "--add-email":
            if len(sys.argv) < 3:
                print("Error: --add-email requires an email address")
                print("Usage: python -m app.scripts.create_admin --add-email <email>")
                sys.exit(1)
            add_admin_user_by_email(db, sys.argv[2])
        elif sys.argv[1] in ["--help", "-h"]:
            show_help()
        else:
            print(f"Unknown command: {sys.argv[1]}")
            show_help()
            sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
