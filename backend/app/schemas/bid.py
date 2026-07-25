import uuid
from pydantic import BaseModel, Field
from datetime import datetime


class BidCreate(BaseModel):
    amount: float = Field(gt=0)


class BidResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    bidder_id: uuid.UUID
    amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True