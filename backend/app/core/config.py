"""
Application configuration using Pydantic Settings.
"""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field
import json


class Settings(BaseSettings):
    """Application settings."""

    # Application
    app_name: str = Field(default="Markdown Editor API", alias="APP_NAME")
    debug: bool = Field(default=False, alias="DEBUG")

    # Security
    secret_key: str = Field(..., alias="SECRET_KEY")
    algorithm: str = Field(default="HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=1440, alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )

    # Google OAuth
    google_client_id: str = Field(default="", alias="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field(default="", alias="GOOGLE_CLIENT_SECRET")

    # Database
    database_url: str = Field(..., alias="DATABASE_URL")

    # CORS
    allowed_origins: List[str] = Field(
        default=["http://localhost:5173"], alias="ALLOWED_ORIGINS"
    )

    # Admin
    initial_admin_emails: str = Field(
        default="admin@example.com", alias="INITIAL_ADMIN_EMAILS"
    )

    # Frontend URL
    frontend_url: str = Field(
        default="http://localhost:5173", alias="FRONTEND_URL"
    )

    # Email/SMTP (optional - if not set, emails will be logged to console)
    smtp_host: str = Field(default="", alias="SMTP_HOST")
    smtp_port: int = Field(default=587, alias="SMTP_PORT")
    smtp_user: str = Field(default="", alias="SMTP_USER")
    smtp_password: str = Field(default="", alias="SMTP_PASSWORD")
    smtp_from_email: str = Field(
        default="noreply@example.com", alias="SMTP_FROM_EMAIL"
    )

    # Monitoring
    sentry_dsn: str = Field(default="", alias="SENTRY_DSN")
    environment: str = Field(default="development", alias="ENVIRONMENT")

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse ALLOWED_ORIGINS if it's a JSON string."""
        if isinstance(self.allowed_origins, str):
            try:
                return json.loads(self.allowed_origins)
            except json.JSONDecodeError:
                return [self.allowed_origins]
        return self.allowed_origins

    @property
    def admin_emails_list(self) -> List[str]:
        """Parse INITIAL_ADMIN_EMAILS as comma-separated list."""
        return [email.strip() for email in self.initial_admin_emails.split(",")]


try:
    settings = Settings()
except Exception as e:
    import sys
    print(f"ERROR: Failed to load settings: {e}", file=sys.stderr)
    raise
