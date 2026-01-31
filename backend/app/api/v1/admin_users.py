"""
Admin user management API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import UUID4

from app.core.database import get_db
from app.models.user import User
from app.schemas.admin import (
    AdminUserResponse,
    AdminUserAddRequest,
    UserDetailResponse,
    UserDetailListResponse,
    UpdateUserStatusRequest,
)
from app.services.admin_service import admin_service
from app.api.deps import require_admin

router = APIRouter()


@router.get("/admins", response_model=List[AdminUserResponse])
def get_admin_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get list of admin users.

    Requires admin privileges.
    """
    admin_users = admin_service.get_admin_users(db)
    return [
        AdminUserResponse(**{**admin_user, "isSelf": admin_user["email"] == current_user.email})
        for admin_user in admin_users
    ]


@router.post("/admins", response_model=AdminUserResponse)
def add_admin_user(
    request: AdminUserAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Add a new admin user.

    Args:
        request: Admin user add request with email

    Requires admin privileges.
    """
    admin_user = admin_service.add_admin_user(db, request.email, current_user.id)
    return AdminUserResponse(**{**admin_user, "isSelf": admin_user["email"] == current_user.email})


@router.delete("/admins/{admin_user_id}")
def remove_admin_user(
    admin_user_id: UUID4,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Remove admin privileges from a user.

    Args:
        admin_user_id: AdminUser record ID

    Requires admin privileges.
    """
    admin_service.remove_admin_user(db, admin_user_id)
    return {"message": "Admin user removed successfully"}


@router.get("/users/details", response_model=UserDetailListResponse)
def get_user_details(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=120),
    status: str = Query("all", description="Filter by status: all, active, suspended"),
    plan: str = Query("all", description="Filter by plan: all, free, monthly, yearly"),
    search: str = Query("", description="Search by name or email"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get detailed user list with plan and status information.

    Simplified version for Phase 11:
    - All users have "free" plan
    - All users have "active" status
    - Supports server-side filtering and pagination

    Requires admin privileges.
    """
    # Build query
    query = db.query(User)

    # Apply search filter
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.name.ilike(search_pattern)) | (User.email.ilike(search_pattern))
        )

    # Note: status and plan filters are ignored in simplified version
    # since all users have "free" plan and "active" status

    # Get total count after filtering
    total = query.count()

    # Calculate pagination
    offset = (page - 1) * limit

    # Get paginated users
    users = query.offset(offset).limit(limit).all()

    # Convert to UserDetailResponse (simplified version)
    user_details = []
    for user in users:
        user_details.append(UserDetailResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            is_admin=user.is_admin,
            plan="free",  # Simplified: all users are free
            status="active",  # Simplified: all users are active
            last_login_at=user.last_login_at,
            created_at=user.created_at,
        ))

    # Calculate total pages
    pages = (total + limit - 1) // limit

    return UserDetailListResponse(
        users=user_details,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: UUID4,
    request: UpdateUserStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Update user status (active/suspended).

    Note: In simplified version, this is a no-op since we don't have
    a status field in the User model yet. Returns success for UI testing.

    Requires admin privileges.
    """
    # Validate status
    if request.status not in ["active", "suspended"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Must be 'active' or 'suspended'",
        )

    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # In simplified version, we don't actually update anything
    # since User model doesn't have a status field yet.
    # This is a placeholder for Phase 11 full implementation.

    return {"message": f"User status updated to {request.status} (simplified version)"}
