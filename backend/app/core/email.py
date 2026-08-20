from email.mime.text import MIMEText
import os
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta, timezone
from jose import jwt


EMAIL_SECRET = os.getenv("EMAIL_SECRET_KEY") or os.getenv("SECRET_KEY")
EMAIL_ALGORITHM = "HS256"


def create_email_token(user_id: str, minutes: int = 60 * 24) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    payload = {"sub": str(user_id), "type": "email_verification", "exp": expire}
    return jwt.encode(payload, EMAIL_SECRET, algorithm=EMAIL_ALGORITHM)


def decode_email_token(token: str) -> dict | None:
    try:
        data = jwt.decode(token, EMAIL_SECRET, algorithms=[EMAIL_ALGORITHM])
        if data.get("type") != "email_verification":
            return None
        return data
    except Exception:
        return None


def send_verification_email(to_email: str, token: str) -> None:
    smtp_host = os.getenv("MAILTRAP_SMTP_HOST", "smtp.mailtrap.io")
    smtp_port = int(os.getenv("MAILTRAP_SMTP_PORT", 2525))
    smtp_user = os.getenv("MAILTRAP_USER")
    smtp_pass = os.getenv("MAILTRAP_PASS")
    from_addr = os.getenv("EMAIL_FROM", "no-reply@thrifted.local")

    # Linku duhet të çojë te faqja e frontend-it (jo direkt te backend-i) — ajo faqe
    # thërret GET /auth/verify-email dhe pastaj tregon UI + ridrejton te /login.
    link = f"{os.getenv('FRONTEND_URL')}/verify-email?token={token}"

    msg = EmailMessage()
    msg["Subject"] = "Verifikoni email-in tuaj - Thrifted"
    msg["From"] = from_addr
    msg["To"] = to_email
    msg.set_content(f"Klikoni linkun për të verifikuar email-in: {link}")
    msg.add_alternative(
        f"<p>Click <a href=\"{link}\">here</a> to verify your email.</p>", subtype="html"
    )

    with smtplib.SMTP(smtp_host, smtp_port) as s:
        if smtp_user and smtp_pass:
            s.login(smtp_user, smtp_pass)
        s.send_message(msg)

def send_password_reset_email(to_email: str, token: str):
    reset_link = f"{os.getenv('FRONTEND_URL')}/reset-password?token={token}"
    subject = "Rivendos password-in - Thrifted"
    body = f"""
    Kërkove rivendosjen e password-it.

    Kliko linkun për të vendosur password të ri:
    {reset_link}

    Ky link skadon brenda 1 ore. Nëse s'e kërkove ti, injoroje këtë email.
    """
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = os.getenv("EMAIL_FROM", "no-reply@thrifted.local")
    msg["To"] = to_email

    smtp_host = os.getenv("MAILTRAP_SMTP_HOST", "smtp.mailtrap.io")
    smtp_port = int(os.getenv("MAILTRAP_SMTP_PORT", 2525))
    smtp_user = os.getenv("MAILTRAP_USER")
    smtp_pass = os.getenv("MAILTRAP_PASS")

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        if smtp_user and smtp_pass:
            server.login(smtp_user, smtp_pass)
        server.sendmail(msg["From"], [to_email], msg.as_string())
