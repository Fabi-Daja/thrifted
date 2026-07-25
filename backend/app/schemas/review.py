# app/schemas/review.py
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class ReviewResponse(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    reviewer_id: uuid.UUID
    reviewee_id: uuid.UUID
    rating: int
    comment: str | None
    created_at: datetime

    class Config:
        from_attributes = True  # (Pydantic v2; përdor orm_mode=True nëse je te v1)