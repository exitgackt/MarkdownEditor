"""
UsageStats database model.
"""
from sqlalchemy import Column, Integer, Date
from sqlalchemy.sql import func
import uuid

from app.core.database import Base
from app.models.user import GUID


class UsageStats(Base):
    """UsageStats model for daily statistics tracking."""

    __tablename__ = "usage_stats"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    date = Column(Date, unique=True, nullable=False, index=True)
    total_users = Column(Integer, default=0, nullable=False)
    active_users = Column(Integer, default=0, nullable=False)
    new_users = Column(Integer, default=0, nullable=False)
    total_logins = Column(Integer, default=0, nullable=False)

    def __repr__(self):
        return f"<UsageStats(date={self.date}, total_users={self.total_users})>"
