"""
LoginHistory database model.
"""
from sqlalchemy import Column, ForeignKey, DateTime, String
from sqlalchemy.sql import func
import uuid

from app.core.database import Base
from app.models.user import GUID


class LoginHistory(Base):
    """LoginHistory model for tracking user login events."""

    __tablename__ = "login_history"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(
        GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    logged_in_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    ip_address = Column(String, nullable=True)

    def __repr__(self):
        return f"<LoginHistory(user_id={self.user_id}, logged_in_at={self.logged_in_at})>"
