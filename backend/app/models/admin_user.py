"""
AdminUser database model.
"""
from sqlalchemy import Column, ForeignKey, DateTime
from sqlalchemy.sql import func
import uuid

from app.core.database import Base
from app.models.user import GUID


class AdminUser(Base):
    """AdminUser model to track who added each admin."""

    __tablename__ = "admin_users"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(
        GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    added_by_user_id = Column(
        GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    added_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self):
        return f"<AdminUser(id={self.id}, user_id={self.user_id})>"
