"""
Fix fulltest@example.com admin_users record.
"""
import sys
import os
from datetime import datetime
import uuid

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

def fix_fulltest_admin():
    """Add admin_users record for fulltest@example.com."""
    engine = create_engine(settings.database_url)

    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()

        try:
            # Get fulltest@example.com user
            result = conn.execute(text("""
                SELECT id, email, is_admin
                FROM users
                WHERE email = 'fulltest@example.com'
            """))
            user = result.fetchone()

            if not user:
                print("ERROR: User fulltest@example.com not found!")
                return

            user_id = user[0]
            is_admin = user[2]

            print(f"Found user: {user[1]}, is_admin={is_admin}")

            # Check if admin_users record already exists
            result = conn.execute(text("""
                SELECT id FROM admin_users WHERE user_id = :user_id
            """), {"user_id": user_id})
            admin_user = result.fetchone()

            if admin_user:
                print("Admin user record already exists!")
                return

            # If is_admin is False, set it to True
            if not is_admin:
                print("Setting is_admin to True...")
                conn.execute(text("""
                    UPDATE users SET is_admin = true WHERE id = :user_id
                """), {"user_id": user_id})

            # Insert admin_users record
            new_id = str(uuid.uuid4())
            now = datetime.utcnow()

            print(f"Inserting admin_users record with id={new_id}...")
            conn.execute(text("""
                INSERT INTO admin_users (id, user_id, added_by_user_id, added_at)
                VALUES (:id, :user_id, :added_by_user_id, :added_at)
            """), {
                "id": new_id,
                "user_id": user_id,
                "added_by_user_id": user_id,  # Self-added
                "added_at": now
            })

            # Commit transaction
            trans.commit()
            print("SUCCESS: Admin user record created!")

            # Verify
            result = conn.execute(text("""
                SELECT au.id, u.email, au.added_at
                FROM admin_users au
                JOIN users u ON au.user_id = u.id
                WHERE u.email = 'fulltest@example.com'
            """))
            verify = result.fetchone()
            if verify:
                print(f"Verified: {dict(verify._mapping)}")

        except Exception as e:
            trans.rollback()
            print(f"ERROR: {e}")
            raise

if __name__ == "__main__":
    fix_fulltest_admin()
