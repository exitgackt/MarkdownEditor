"""
User database model.
"""
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.types import TypeDecorator, CHAR
import uuid

from app.core.database import Base


class GUID(TypeDecorator):
    """Platform-independent GUID type.

    Uses PostgreSQL's UUID type, otherwise uses CHAR(36), storing as stringified hex values.
    """

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == "postgresql":
            return value
        else:
            if isinstance(value, uuid.UUID):
                return str(value)
            return str(uuid.UUID(value))

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(value)
            return value


class User(Base):
    """User model for authentication and user management."""

    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    google_id = Column(String, unique=True, nullable=True, index=True)  # Now nullable for email auth
    hashed_password = Column(String, nullable=True)  # For email/password authentication
    auth_provider = Column(String, default="email", nullable=False)  # "email", "google", "both"
    email_verified = Column(Boolean, default=False, nullable=False)  # Email verification status
    email_verification_token = Column(String, nullable=True)  # Token for email verification
    password_reset_token = Column(String, nullable=True)  # Token for password reset
    password_reset_expires = Column(DateTime(timezone=True), nullable=True)  # Reset token expiration
    is_admin = Column(Boolean, default=False, nullable=False)
    terms_accepted = Column(Boolean, default=False, nullable=False)  # Terms of service acceptance
    terms_accepted_at = Column(DateTime(timezone=True), nullable=True)  # Terms acceptance timestamp
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, is_admin={self.is_admin})>"
