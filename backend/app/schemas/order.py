from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class OrderRead(BaseModel):
    id: UUID
    product_id: UUID
    buyer_id: UUID
    seller_id: UUID
    final_price: Decimal
    status: str
    created_at: datetime

    class Config:
        from_attributes = True  