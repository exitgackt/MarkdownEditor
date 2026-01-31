"""
Script to check admin users data consistency.
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

def check_admin_users():
    """Check admin users data in database."""
    engine = create_engine(settings.database_url)

    with engine.connect() as conn:
        print("=== All Admin Users (admin_users table) ===")
        result = conn.execute(text("SELECT * FROM admin_users"))
        admin_users = result.fetchall()
        for row in admin_users:
            print(row)

        print("\n=== All Users with is_admin=true ===")
        result = conn.execute(text("SELECT id, email, name, is_admin FROM users WHERE is_admin = true"))
        users = result.fetchall()
        for row in users:
            print(row)

        print("\n=== Check for orphaned admin_users (no matching user) ===")
        result = conn.execute(text("""
            SELECT au.id, au.user_id, au.added_at
            FROM admin_users au
            LEFT JOIN users u ON au.user_id = u.id
            WHERE u.id IS NULL
        """))
        orphaned = result.fetchall()
        if orphaned:
            print("Found orphaned admin_users:")
            for row in orphaned:
                print(row)
        else:
            print("No orphaned admin_users found")

        print("\n=== Check fulltest@example.com ===")
        result = conn.execute(text("SELECT * FROM users WHERE email = 'fulltest@example.com'"))
        user = result.fetchone()
        if user:
            print("User found:", user)
        else:
            print("User NOT found in users table")

if __name__ == "__main__":
    check_admin_users()
