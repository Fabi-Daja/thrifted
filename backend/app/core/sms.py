"""Dergimi i kodit OTP per verifikimin e numrit te telefonit.

Mirror i app/core/email.py, por per SMS. Ndryshe nga email-i (ku Mailtrap
kap dergesat ne dev pa i dorezuar realisht), Thrifted S'KA AKOMA nje ofrues
SMS te zgjedhur/konfiguruar - shih "Vendime te Hapura" te
docs/faza/faza-2-frontend-integrimi.md. Ne mungese te
SMS_PROVIDER_URL/SMS_PROVIDER_API_KEY, kodi thjesht LOGOHET (mjafton per
zhvillim/teste lokale - mund ta lexosh nga output-i i `uvicorn`). Kur te
vendoset nje ofrues real (Twilio, Vonage, ose nje gateway shqiptar), duhet
vetem plotesuar _send_via_http me kerkesen HTTP perkatese te atij ofruesi -
pjesa tjeter e flow-it (gjenerimi, hash-imi, skadimi, kufizimi i
tentativave) mbetet e njejte.
"""
import logging
import os
import secrets

logger = logging.getLogger("thrifted.sms")

PHONE_CODE_LENGTH = 6
PHONE_CODE_TTL_MINUTES = 10
PHONE_CODE_MAX_ATTEMPTS = 5
PHONE_CODE_RESEND_COOLDOWN_SECONDS = 60


def generate_otp_code() -> str:
    return "".join(secrets.choice("0123456789") for _ in range(PHONE_CODE_LENGTH))


def send_verification_sms(phone_number: str, code: str) -> None:
    provider_url = os.getenv("SMS_PROVIDER_URL")
    api_key = os.getenv("SMS_PROVIDER_API_KEY")

    if provider_url and api_key:
        _send_via_http(provider_url, api_key, phone_number, code)
        return

    # Fallback per dev/teste lokale - asnje SMS reale s'dergohet.
    logger.warning(
        "SMS_PROVIDER_URL/SMS_PROVIDER_API_KEY s'jane konfiguruar - kodi i "
        "verifikimit per %s eshte: %s (vetem ne log, s'u dergua asnje SMS reale)",
        phone_number,
        code,
    )


def _send_via_http(provider_url: str, api_key: str, phone_number: str, code: str) -> None:
    import httpx

    httpx.post(
        provider_url,
        headers={"Authorization": f"Bearer {api_key}"},
        json={"to": phone_number, "message": f"Kodi yt i verifikimit Thrifted: {code}"},
        timeout=10,
    )
