"""
SystemSettings database model.
"""
from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.user import GUID


class SystemSettings(Base):
    """SystemSettings model for application-wide configuration."""

    __tablename__ = "system_settings"

    id = Column(GUID, primary_key=True)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    updated_by_user_id = Column(
        GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    version = Column(String, nullable=True)

    def __repr__(self):
        return f"<SystemSettings(key={self.key})>"
