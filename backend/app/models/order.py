import uuid
from datetime import datetime
from sqlalchemy import Column, ForeignKey, String, Numeric, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base  # Supozojmë se këtu ke deklaruar Base e SQLAlchemy

class Order(Base):
    __tablename__ = "orders"    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), unique=True, nullable=False)

    buyer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    final_price = Column(Numeric(precision=10, scale=2), nullable=False)
    status = Column(String, default="completed", nullable=False)  # p.sh., completed, refunded
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    product = relationship("Product")
    buyer = relationship("User", foreign_keys=[buyer_id])
    seller = relationship("User", foreign_keys=[seller_id])