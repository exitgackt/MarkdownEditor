"""
Authentication service for Google OAuth and email/password authentication.
"""
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
import secrets
import re
import bcrypt
from google.oauth2 import id_token
from google.auth.transport import requests
from fastapi import HTTPException, status

from app.core.config import settings


class AuthService:
    """Service for handling authentication operations."""

    @staticmethod
    def verify_google_token(token: str) -> Dict[str, Any]:
        """
        Verify Google ID token and extract user information.

        Args:
            token: Google ID token string

        Returns:
            Dictionary containing user information (email, name, google_id)

        Raises:
            HTTPException: If token is invalid
        """
        try:
            # Verify the token
            idinfo = id_token.verify_oauth2_token(
                token, requests.Request(), settings.google_client_id
            )

            # Verify issuer
            if idinfo["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
                raise ValueError("Wrong issuer")

            # Extract user information
            return {
                "google_id": idinfo["sub"],
                "email": idinfo.get("email"),
                "name": idinfo.get("name", ""),
            }

        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Google token: {str(e)}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Failed to verify Google token: {str(e)}",
            )


    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash a password using bcrypt.

        Args:
            password: Plain text password

        Returns:
            Hashed password string
        """
        # Encode password to bytes and hash with bcrypt
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verify a password against its hash.

        Args:
            plain_password: Plain text password to verify
            hashed_password: Hashed password to compare against

        Returns:
            True if password matches, False otherwise
        """
        # Encode both the plain password and hashed password to bytes
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)

    @staticmethod
    def validate_password_strength(password: str, settings_dict: Optional[Dict[str, Any]] = None) -> Tuple[bool, str]:
        """
        Validate password strength based on policy settings.

        Args:
            password: Password to validate
            settings_dict: Dictionary containing password policy settings

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Default settings
        min_length = 8
        require_uppercase = True
        require_lowercase = True
        require_number = True
        require_special = False

        # Apply custom settings if provided
        if settings_dict:
            min_length = settings_dict.get("password_min_length", min_length)
            require_uppercase = settings_dict.get("password_require_uppercase", require_uppercase)
            require_lowercase = settings_dict.get("password_require_lowercase", require_lowercase)
            require_number = settings_dict.get("password_require_number", require_number)
            require_special = settings_dict.get("password_require_special", require_special)

        # Check minimum length
        if len(password) < min_length:
            return False, f"パスワードは{min_length}文字以上である必要があります"

        # Check for uppercase letters
        if require_uppercase and not re.search(r"[A-Z]", password):
            return False, "パスワードには大文字を含める必要があります"

        # Check for lowercase letters
        if require_lowercase and not re.search(r"[a-z]", password):
            return False, "パスワードには小文字を含める必要があります"

        # Check for numbers
        if require_number and not re.search(r"\d", password):
            return False, "パスワードには数字を含める必要があります"

        # Check for special characters
        if require_special and not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            return False, "パスワードには特殊文字を含める必要があります"

        return True, ""

    @staticmethod
    def generate_verification_token() -> str:
        """
        Generate a secure random token for email verification.

        Returns:
            Random token string
        """
        return secrets.token_urlsafe(32)

    @staticmethod
    def generate_password_reset_token() -> Tuple[str, datetime]:
        """
        Generate a secure random token for password reset with expiration.

        Returns:
            Tuple of (token, expiration_datetime)
        """
        token = secrets.token_urlsafe(32)
        expires = datetime.utcnow() + timedelta(hours=1)
        return token, expires


auth_service = AuthService()
