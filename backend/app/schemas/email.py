from pydantic import BaseModel, EmailStr


class ResendRequest(BaseModel):
    email: EmailStr