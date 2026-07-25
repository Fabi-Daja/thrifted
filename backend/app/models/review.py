# app/models/review.py
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), unique=True, nullable=False)

    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)  # blerësi
    reviewee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)  # shitësi

    rating = Column(Integer, nullable=False)
    comment = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("Order")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    reviewee = relationship("User", foreign_keys=[reviewee_id])

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="rating_range_check"),
    )