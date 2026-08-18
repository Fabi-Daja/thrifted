import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, nullable=True)
    brand = Column(String, nullable=True)
    size = Column(String, nullable=True)
    color = Column(String, nullable=True)
    condition_rating = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)

    selling_type = Column(String, nullable=False, default="fixed_price")
    status = Column(String, nullable=False, default="active")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    images = relationship("ProductImage", cascade="all, delete-orphan", order_by="ProductImage.order_index")
    orders = relationship("Order", back_populates="product")
