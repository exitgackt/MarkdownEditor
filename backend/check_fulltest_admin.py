"""
Check fulltest@example.com admin status in database.
"""
import asyncio
from sqlalchemy import create_engine, text
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/dbname")

async def check_fulltest_admin():
    """Check fulltest@example.com in database."""
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        print("=== Check fulltest@example.com user record ===")
        result = conn.execute(text("""
            SELECT id, email, name, is_admin, created_at
            FROM users
            WHERE email = 'fulltest@example.com'
        """))
        user = result.fetchone()
        if user:
            print(f"User found: {dict(user._mapping)}")
            user_id = user[0]

            print("\n=== Check admin_users record for fulltest@example.com ===")
            result = conn.execute(text("""
                SELECT id, user_id, added_by_user_id, added_at
                FROM admin_users
                WHERE user_id = :user_id
            """), {"user_id": user_id})
            admin_user = result.fetchone()
            if admin_user:
                print(f"Admin user record found: {dict(admin_user._mapping)}")
            else:
                print("No admin_users record found!")

            print("\n=== Check JOIN result ===")
            result = conn.execute(text("""
                SELECT au.id, au.user_id, u.email, u.name, au.added_at
                FROM admin_users au
                JOIN users u ON au.user_id = u.id
                WHERE u.email = 'fulltest@example.com'
            """))
            join_result = result.fetchone()
            if join_result:
                print(f"JOIN successful: {dict(join_result._mapping)}")
            else:
                print("JOIN failed - no result!")
        else:
            print("User NOT found!")

        print("\n=== All admin_users records ===")
        result = conn.execute(text("""
            SELECT au.id, au.user_id, u.email, u.is_admin
            FROM admin_users au
            LEFT JOIN users u ON au.user_id = u.id
            ORDER BY au.added_at
        """))
        all_admin_users = result.fetchall()
        for row in all_admin_users:
            print(dict(row._mapping))

if __name__ == "__main__":
    asyncio.run(check_fulltest_admin())
