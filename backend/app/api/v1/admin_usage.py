"""
Admin usage statistics API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.admin import (
    UsageSummaryResponse,
    UsageStatsResponse,
    UserListResponse,
)
from app.services.admin_service import admin_service
from app.api.deps import require_admin

router = APIRouter()


@router.get("/summary", response_model=UsageSummaryResponse)
def get_usage_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get usage summary statistics.

    Requires admin privileges.
    """
    summary = admin_service.get_usage_summary(db)
    return UsageSummaryResponse(**summary)


@router.get("/stats", response_model=List[UsageStatsResponse])
def get_usage_stats(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get usage statistics for the last N days.

    Args:
        days: Number of days to retrieve (1-365)

    Requires admin privileges.
    """
    stats = admin_service.get_usage_stats(db, days)
    return [UsageStatsResponse.model_validate(stat) for stat in stats]


@router.get("/users", response_model=UserListResponse)
def get_users(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get paginated list of users.

    Args:
        page: Page number (default: 1)
        limit: Items per page (default: 20, max: 100)

    Requires admin privileges.
    """
    result = admin_service.get_users_paginated(db, page, limit)
    return UserListResponse(**result)
