"""
Rate limiting middleware for authentication endpoints.
"""
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List
from fastapi import HTTPException, status, Request


class RateLimiter:
    """In-memory rate limiter for authentication attempts."""

    def __init__(self):
        # Store login attempts: {ip_address: [timestamp1, timestamp2, ...]}
        self.login_attempts: Dict[str, List[datetime]] = defaultdict(list)
        # Store registration attempts
        self.registration_attempts: Dict[str, List[datetime]] = defaultdict(list)

    def check_login_rate_limit(
        self,
        request: Request,
        max_attempts: int = 5,
        time_window_minutes: int = 15
    ) -> None:
        """
        Check if login rate limit is exceeded.

        Args:
            request: FastAPI request object
            max_attempts: Maximum number of attempts allowed
            time_window_minutes: Time window in minutes

        Raises:
            HTTPException: If rate limit is exceeded
        """
        ip_address = request.client.host if request.client else "unknown"
        self._check_rate_limit(
            self.login_attempts,
            ip_address,
            max_attempts,
            time_window_minutes,
            "ログイン試行回数が上限に達しました。しばらく待ってから再試行してください。"
        )

    def check_registration_rate_limit(
        self,
        request: Request,
        max_attempts: int = 3,
        time_window_minutes: int = 60
    ) -> None:
        """
        Check if registration rate limit is exceeded.

        Args:
            request: FastAPI request object
            max_attempts: Maximum number of attempts allowed
            time_window_minutes: Time window in minutes

        Raises:
            HTTPException: If rate limit is exceeded
        """
        ip_address = request.client.host if request.client else "unknown"
        self._check_rate_limit(
            self.registration_attempts,
            ip_address,
            max_attempts,
            time_window_minutes,
            "登録試行回数が上限に達しました。しばらく待ってから再試行してください。"
        )

    def _check_rate_limit(
        self,
        attempts_dict: Dict[str, List[datetime]],
        ip_address: str,
        max_attempts: int,
        time_window_minutes: int,
        error_message: str
    ) -> None:
        """
        Internal method to check rate limit.

        Args:
            attempts_dict: Dictionary to store attempts
            ip_address: Client IP address
            max_attempts: Maximum number of attempts allowed
            time_window_minutes: Time window in minutes
            error_message: Error message to display

        Raises:
            HTTPException: If rate limit is exceeded
        """
        now = datetime.utcnow()
        cutoff_time = now - timedelta(minutes=time_window_minutes)

        # Remove old attempts
        attempts_dict[ip_address] = [
            attempt for attempt in attempts_dict[ip_address]
            if attempt > cutoff_time
        ]

        # Check if limit exceeded
        if len(attempts_dict[ip_address]) >= max_attempts:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=error_message
            )

        # Record new attempt
        attempts_dict[ip_address].append(now)

    def reset_login_attempts(self, ip_address: str) -> None:
        """Reset login attempts for successful login."""
        if ip_address in self.login_attempts:
            del self.login_attempts[ip_address]


# Global rate limiter instance
rate_limiter = RateLimiter()
