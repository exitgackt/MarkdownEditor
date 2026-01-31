"""
Daily statistics aggregation script.

This script should be run daily (e.g., via cron job) to aggregate usage statistics.
"""
import sys
import os
from datetime import date, datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from sqlalchemy import func
from app.core.database import SessionLocal
from app.models.user import User
from app.models.login_history import LoginHistory
from app.models.usage_stats import UsageStats
import uuid


def aggregate_daily_stats(target_date: date = None):
    """
    Aggregate usage statistics for a specific date.

    Args:
        target_date: Date to aggregate (defaults to yesterday)
    """
    if target_date is None:
        target_date = date.today() - timedelta(days=1)

    db = SessionLocal()

    try:
        print(f"Aggregating stats for {target_date}...")

        # Total users count
        total_users = db.query(func.count(User.id)).scalar() or 0

        # New users count (users created on target date)
        start_datetime = datetime.combine(target_date, datetime.min.time())
        end_datetime = datetime.combine(target_date, datetime.max.time())

        new_users = (
            db.query(func.count(User.id))
            .filter(User.created_at >= start_datetime, User.created_at <= end_datetime)
            .scalar()
            or 0
        )

        # Active users (users who logged in on target date)
        active_users = (
            db.query(func.count(func.distinct(LoginHistory.user_id)))
            .filter(
                LoginHistory.logged_in_at >= start_datetime,
                LoginHistory.logged_in_at <= end_datetime,
            )
            .scalar()
            or 0
        )

        # Total logins count
        total_logins = (
            db.query(func.count(LoginHistory.id))
            .filter(
                LoginHistory.logged_in_at >= start_datetime,
                LoginHistory.logged_in_at <= end_datetime,
            )
            .scalar()
            or 0
        )

        # Check if stats already exist for this date
        existing_stats = (
            db.query(UsageStats).filter(UsageStats.date == target_date).first()
        )

        if existing_stats:
            # Update existing stats
            existing_stats.total_users = total_users
            existing_stats.active_users = active_users
            existing_stats.new_users = new_users
            existing_stats.total_logins = total_logins
            print(f"Updated existing stats for {target_date}")
        else:
            # Create new stats record
            stats = UsageStats(
                id=uuid.uuid4(),
                date=target_date,
                total_users=total_users,
                active_users=active_users,
                new_users=new_users,
                total_logins=total_logins,
            )
            db.add(stats)
            print(f"Created new stats for {target_date}")

        db.commit()

        print(f"Stats for {target_date}:")
        print(f"  Total Users: {total_users}")
        print(f"  Active Users: {active_users}")
        print(f"  New Users: {new_users}")
        print(f"  Total Logins: {total_logins}")

    except Exception as e:
        print(f"Error aggregating stats: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def aggregate_last_n_days(days: int = 7):
    """
    Aggregate statistics for the last N days.

    Args:
        days: Number of days to aggregate
    """
    today = date.today()
    for i in range(days):
        target_date = today - timedelta(days=i + 1)
        aggregate_daily_stats(target_date)
        print()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Aggregate daily usage statistics")
    parser.add_argument(
        "--date",
        type=str,
        help="Date to aggregate (YYYY-MM-DD format). Defaults to yesterday.",
    )
    parser.add_argument(
        "--last-n-days",
        type=int,
        help="Aggregate statistics for the last N days",
    )

    args = parser.parse_args()

    if args.last_n_days:
        aggregate_last_n_days(args.last_n_days)
    elif args.date:
        target_date = datetime.strptime(args.date, "%Y-%m-%d").date()
        aggregate_daily_stats(target_date)
    else:
        # Default: aggregate yesterday's stats
        aggregate_daily_stats()
