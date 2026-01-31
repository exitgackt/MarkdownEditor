"""
Email service for sending verification and password reset emails.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails."""

    @staticmethod
    async def send_verification_email(email: str, token: str) -> bool:
        """
        Send email verification link to user.

        Args:
            email: User's email address
            token: Verification token

        Returns:
            True if email sent successfully, False otherwise
        """
        verification_url = f"{settings.frontend_url}/verify-email?token={token}"

        subject = "メールアドレスの確認 - Markdown Editor"
        body = f"""
        Markdown Editorへようこそ！

        以下のリンクをクリックしてメールアドレスを確認してください:
        {verification_url}

        このリンクは24時間有効です。

        このメールに心当たりがない場合は、無視してください。
        """

        return await EmailService._send_email(email, subject, body)

    @staticmethod
    async def send_password_reset_email(email: str, token: str) -> bool:
        """
        Send password reset link to user.

        Args:
            email: User's email address
            token: Password reset token

        Returns:
            True if email sent successfully, False otherwise
        """
        reset_url = f"{settings.frontend_url}/reset-password/{token}"

        subject = "パスワードリセット - Markdown Editor"
        body = f"""
        パスワードリセットのリクエストを受け付けました。

        以下のリンクをクリックして新しいパスワードを設定してください:
        {reset_url}

        このリンクは1時間有効です。

        このリクエストに心当たりがない場合は、無視してください。
        """

        return await EmailService._send_email(email, subject, body)

    @staticmethod
    async def _send_email(to_email: str, subject: str, body: str) -> bool:
        """
        Internal method to send email.

        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Email body

        Returns:
            True if email sent successfully, False otherwise
        """
        # In development environment, just log the email
        if not settings.smtp_host:
            logger.info(f"[DEV MODE] Email to {to_email}")
            logger.info(f"Subject: {subject}")
            logger.info(f"Body:\n{body}")
            logger.info("=" * 80)
            return True

        try:
            # Create message
            message = MIMEMultipart()
            message["From"] = settings.smtp_from_email
            message["To"] = to_email
            message["Subject"] = subject
            message.attach(MIMEText(body, "plain"))

            # Send email
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                if settings.smtp_user and settings.smtp_password:
                    server.starttls()
                    server.login(settings.smtp_user, settings.smtp_password)
                server.send_message(message)

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False


email_service = EmailService()
