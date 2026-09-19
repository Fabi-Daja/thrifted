import re
from pydantic import BaseModel, Field, field_validator

# Pranon numra me ose pa +, 8-15 shifra (mjafton per formatin shqiptar +355...
# dhe formate te tjera nderkombetare, pa qene tepër strikte).
PHONE_REGEX = re.compile(r"^\+?[0-9]{8,15}$")


class SendPhoneCodeRequest(BaseModel):
    phone_number: str

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        cleaned = value.strip().replace(" ", "")
        if not PHONE_REGEX.match(cleaned):
            raise ValueError("Numër telefoni i pavlefshëm")
        return cleaned


class VerifyPhoneCodeRequest(BaseModel):
    code: str = Field(min_length=4, max_length=8)
