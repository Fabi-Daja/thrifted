import re
import uuid
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime


# Çfarë pranon API kur dikush regjistrohet
class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=8)

    @field_validator("password")
    def validate_password_strength(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password duhet të ketë të paktën 8 karaktere")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password duhet të ketë të paktën një shkronjë të madhe (uppercase)")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password duhet të ketë të paktën një shkronjë të vogël (lowercase)")
        if not re.search(r"\d", value):
            raise ValueError("Password duhet të ketë të paktën një numër")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise ValueError("Password duhet të ketë të paktën një simbol special")
        return value

# Çfarë pranon API kur dikush bën login
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Çfarë kthen API si përgjigje (kurrë s'kthejmë password_hash!). Përdoret te
# profili PUBLIK (GET /users/{id}) - prandaj vetëm `is_phone_verified` (badge
# besueshmërie, njësoj si "Shitës i verifikuar" te UI) është këtu, jo vetë
# numri (privat - shih UserPrivateResponse më poshtë).
class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    username: str
    is_email_verified: bool
    full_name: Optional[str] = None
    profile_photo_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    rating_avg: float
    rating_count: int
    is_phone_verified: bool = False
    created_at: datetime
    # Jo kolona te modelit User - bashkangjiten si atribute jo-persistente nga
    # routers/users.py::_attach_follow_stats() para kthimit te çdo endpoint,
    # sepse kerkojne COUNT(*) mbi tabelen `follows`. `is_following` mbetet
    # None per guest (s'ka viewer) dhe kur useri shikon profilin e vet.
    followers_count: int = 0
    following_count: int = 0
    is_following: Optional[bool] = None

    class Config:
        from_attributes = True  # lejon konvertimin direkt nga modeli SQLAlchemy


# Çfarë kthen API për VETË userin e loguar (GET/PATCH /users/me) - shton
# numrin e telefonit, që s'duhet kurrë të dalë te profili publik i dikujt
# tjetër.
class UserPrivateResponse(UserResponse):
    phone_number: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

import re
from pydantic import BaseModel, Field, field_validator


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password duhet të ketë të paktën 8 karaktere")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password duhet të ketë të paktën një shkronjë të madhe (uppercase)")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password duhet të ketë të paktën një shkronjë të vogël (lowercase)")
        if not re.search(r"\d", value):
            raise ValueError("Password duhet të ketë të paktën një numër")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise ValueError("Password duhet të ketë të paktën një simbol special")
        return value
    
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    profile_photo_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    username: Optional[str] = Field(default=None, min_length=3, max_length=30)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password duhet të ketë të paktën një shkronjë të madhe")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password duhet të ketë të paktën një shkronjë të vogël")
        if not re.search(r"\d", value):
            raise ValueError("Password duhet të ketë të paktën një numër")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise ValueError("Password duhet të ketë të paktën një simbol special")
        return value