import uuid
from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector

from app.core.database import Base
from app.services.voyage_client import EMBEDDING_DIMENSION


class ProductImageEmbedding(Base):
    """§5.3 (faza-5-ai-features.md) - embedding multimodal (Voyage AI,
    voyage-multimodal-3.5) per nje foto produkti, per kerkim me ngjashmeri
    vizuale (POST /ai/search-by-image). Nje rresht per foto (jo per produkt),
    sepse nje produkt ka disa foto/kende dhe secila indeksohet vecmas."""
    __tablename__ = "product_image_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    image_id = Column(UUID(as_uuid=True), ForeignKey("product_images.id"), nullable=False, unique=True)

    embedding = Column(Vector(EMBEDDING_DIMENSION), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product")
    image = relationship("ProductImage")
