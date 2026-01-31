"""
Admin service for managing system settings, statistics, and users.
"""
from datetime import datetime, date, timedelta
from zoneinfo import ZoneInfo
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from fastapi import HTTPException, status
import uuid
import json

from app.models.user import User
from app.models.admin_user import AdminUser
from app.models.system_settings import SystemSettings
from app.models.usage_stats import UsageStats
from app.models.login_history import LoginHistory


class AdminService:
    """Service for admin operations."""

    # System Settings Keys
    SETTINGS_BROWSER_GUIDE = "browser_guide"
    SETTINGS_TERMS = "terms"
    SETTINGS_MAINTENANCE = "maintenance"
    SETTINGS_AUTH = "auth_settings"

    # Default authentication settings
    DEFAULT_AUTH_SETTINGS = {
        "mode": "email",  # "email", "google", "both"
        "email_verification_required": True,
        "password_min_length": 8,
        "password_require_uppercase": True,
        "password_require_lowercase": True,
        "password_require_number": True,
        "password_require_special": False,
    }

    @staticmethod
    def get_usage_summary(db: Session) -> Dict[str, Any]:
        """
        Get usage summary statistics.

        Args:
            db: Database session

        Returns:
            Dictionary with usage summary
        """
        today = date.today()

        # Total users count
        total_users = db.query(func.count(User.id)).scalar() or 0

        # Today's stats
        today_stats = db.query(UsageStats).filter(UsageStats.date == today).first()

        return {
            "total_users": total_users,
            "active_users_today": today_stats.active_users if today_stats else 0,
            "new_users_today": today_stats.new_users if today_stats else 0,
            "total_logins_today": today_stats.total_logins if today_stats else 0,
        }

    @staticmethod
    def get_usage_stats(db: Session, days: int = 30) -> List[UsageStats]:
        """
        Get usage statistics for the last N days.

        Args:
            db: Database session
            days: Number of days to retrieve

        Returns:
            List of UsageStats
        """
        start_date = date.today() - timedelta(days=days)
        return (
            db.query(UsageStats)
            .filter(UsageStats.date >= start_date)
            .order_by(desc(UsageStats.date))
            .all()
        )

    @staticmethod
    def get_users_paginated(
        db: Session, page: int = 1, limit: int = 20
    ) -> Dict[str, Any]:
        """
        Get paginated list of users.

        Args:
            db: Database session
            page: Page number (1-indexed)
            limit: Items per page

        Returns:
            Dictionary with users list and pagination info
        """
        offset = (page - 1) * limit
        total = db.query(func.count(User.id)).scalar() or 0

        users = (
            db.query(User)
            .order_by(desc(User.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )

        pages = (total + limit - 1) // limit  # Ceiling division

        return {
            "users": users,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages,
        }

    @staticmethod
    def get_system_setting(db: Session, key: str) -> Optional[SystemSettings]:
        """
        Get system setting by key.

        Args:
            db: Database session
            key: Setting key

        Returns:
            SystemSettings object or None
        """
        return db.query(SystemSettings).filter(SystemSettings.key == key).first()

    @staticmethod
    def update_system_setting(
        db: Session, key: str, value: str, user_id: uuid.UUID, version: Optional[str] = None
    ) -> SystemSettings:
        """
        Update or create system setting.

        Args:
            db: Database session
            key: Setting key
            value: Setting value
            user_id: User ID who is updating
            version: Optional version string

        Returns:
            Updated SystemSettings object
        """
        setting = db.query(SystemSettings).filter(SystemSettings.key == key).first()

        if setting:
            setting.value = value
            setting.updated_by_user_id = user_id
            setting.updated_at = datetime.utcnow()
            setting.version = version
        else:
            setting = SystemSettings(
                id=uuid.uuid4(),
                key=key,
                value=value,
                updated_by_user_id=user_id,
                version=version,
            )
            db.add(setting)

        db.commit()
        db.refresh(setting)
        return setting

    @staticmethod
    def get_admin_users(db: Session) -> List[Dict[str, Any]]:
        """
        Get list of admin users with details.

        Args:
            db: Database session

        Returns:
            List of admin user dictionaries
        """
        admin_users = (
            db.query(AdminUser, User)
            .join(User, AdminUser.user_id == User.id)
            .all()
        )

        result = []
        for admin_user, user in admin_users:
            added_by_user = None
            if admin_user.added_by_user_id:
                added_by_user = db.query(User).filter(User.id == admin_user.added_by_user_id).first()

            # Convert UTC to JST
            jst_added_at = admin_user.added_at.replace(tzinfo=ZoneInfo("UTC")).astimezone(ZoneInfo("Asia/Tokyo"))

            result.append({
                "id": admin_user.id,
                "user_id": user.id,
                "email": user.email,
                "name": user.name,
                "added_at": jst_added_at,
                "added_by_email": added_by_user.email if added_by_user else None,
            })

        return result

    @staticmethod
    def add_admin_user(db: Session, email: str, added_by_user_id: uuid.UUID) -> Dict[str, Any]:
        """
        Add a new admin user.

        Args:
            db: Database session
            email: Email of user to promote to admin
            added_by_user_id: User ID who is adding the admin

        Returns:
            Admin user dictionary

        Raises:
            HTTPException: If user not found or already admin
        """
        # Find user by email
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="登録されていないユーザーです",
            )

        # Check if already admin
        if user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{email} は既に管理者として登録されています",
            )

        # Update user
        user.is_admin = True

        # Create admin_user record
        admin_user = AdminUser(
            id=uuid.uuid4(),
            user_id=user.id,
            added_by_user_id=added_by_user_id,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        added_by_user = db.query(User).filter(User.id == added_by_user_id).first()

        # Convert UTC to JST
        jst_added_at = admin_user.added_at.replace(tzinfo=ZoneInfo("UTC")).astimezone(ZoneInfo("Asia/Tokyo"))

        return {
            "id": admin_user.id,
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
            "added_at": jst_added_at,
            "added_by_email": added_by_user.email if added_by_user else None,
        }

    @staticmethod
    def remove_admin_user(db: Session, admin_user_id: uuid.UUID) -> None:
        """
        Remove admin privileges from a user.

        Args:
            db: Database session
            admin_user_id: AdminUser record ID

        Raises:
            HTTPException: If admin user not found
        """
        admin_user = db.query(AdminUser).filter(AdminUser.id == admin_user_id).first()
        if not admin_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin user not found",
            )

        # Get user and remove admin flag
        user = db.query(User).filter(User.id == admin_user.user_id).first()
        if user:
            user.is_admin = False

        # Delete admin_user record
        db.delete(admin_user)
        db.commit()

    @staticmethod
    def get_setting(db: Session, key: str) -> Optional[Dict[str, Any]]:
        """
        Get setting value as dictionary.

        Args:
            db: Database session
            key: Setting key

        Returns:
            Setting value as dictionary or None
        """
        setting = db.query(SystemSettings).filter(SystemSettings.key == key).first()
        if not setting:
            # Return default for auth_settings
            if key == AdminService.SETTINGS_AUTH:
                return AdminService.DEFAULT_AUTH_SETTINGS
            return None

        try:
            return json.loads(setting.value)
        except (json.JSONDecodeError, TypeError):
            return {"value": setting.value}

    @staticmethod
    def update_setting(
        db: Session, key: str, value: Dict[str, Any], user_id: uuid.UUID
    ) -> SystemSettings:
        """
        Update or create setting with dictionary value.

        Args:
            db: Database session
            key: Setting key
            value: Setting value as dictionary
            user_id: User ID who is updating

        Returns:
            Updated SystemSettings object
        """
        value_str = json.dumps(value)
        return AdminService.update_system_setting(db, key, value_str, user_id)

    @staticmethod
    def record_login(db: Session, user_id: uuid.UUID, ip_address: Optional[str] = None) -> LoginHistory:
        """
        Record a login event.

        Args:
            db: Database session
            user_id: User ID
            ip_address: Optional IP address

        Returns:
            LoginHistory object
        """
        login_history = LoginHistory(
            id=uuid.uuid4(),
            user_id=user_id,
            ip_address=ip_address,
        )
        db.add(login_history)
        db.commit()
        db.refresh(login_history)
        return login_history


admin_service = AdminService()
