import uuid
from sqlalchemy import Column, String, Boolean, Float, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    is_email_verified = Column(Boolean, default=False)
    username = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=True)
    profile_photo_url = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    location = Column(String, nullable=True)
    rating_avg = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Verifikim numri telefoni (gate para postimit te nje produkti - shih
    # docs/faza/faza-2-frontend-integrimi.md, deck Thrifted-dizajni.pptx slide 11).
    # Kodi OTP ruhet i hash-uar (jo i thjeshte), njesoj si password - s'ka
    # nevoje per tabele te vecante, nje kod aktiv per user mjafton.
    phone_number = Column(String, nullable=True)
    is_phone_verified = Column(Boolean, default=False)
    phone_verification_code_hash = Column(String, nullable=True)
    phone_verification_expires_at = Column(DateTime(timezone=True), nullable=True)
    phone_verification_attempts = Column(Integer, default=0)
    phone_verification_sent_at = Column(DateTime(timezone=True), nullable=True)