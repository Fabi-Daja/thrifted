import uuid
from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base


class Follow(Base):
    __tablename__ = "follows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # ondelete=CASCADE que ne fillim (mesim nga bug-u i product_image_embeddings,
    # shih docs/faza/faza-5-ai-features.md, e1f2a3b4c5d6) - kur nje user fshihet,
    # rreshtat e follow-it lidhur me te s'kane kuptim te mbeten "orfane".
    follower_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    followed_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("follower_id", "followed_id", name="unique_follower_followed"),
        CheckConstraint("follower_id != followed_id", name="ck_follow_not_self"),
    )
