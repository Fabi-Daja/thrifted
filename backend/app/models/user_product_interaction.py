import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class UserProductInteraction(Base):
    """§5.5 (faza-5-ai-features.md) - nje rresht per ndervprim user-produkt
    (view / favorite / purchase / search), perdoret nga recommendation_service.py
    per te ndertuar nje embedding te ponderuar te "shijes" se userit (mesatarizim
    mbi product_image_embeddings te 5.3, jo infrastrukture e re AI). Nje user mund
    te kete disa rreshta per te njejtin produkt (p.sh. disa 'view' te ndara ne kohe)
    - QELLIMISHT s'ka unique constraint, çdo ndervprim regjistrohet vecmas."""
    __tablename__ = "user_product_interactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)

    interaction_type = Column(String, nullable=False)
    weight = Column(Integer, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    product = relationship("Product")
