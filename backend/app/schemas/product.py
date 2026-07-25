import uuid
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SellingType(str, Enum):
    fixed_price = "fixed_price"
    offers_only = "offers_only"
    fixed_price_offers = "fixed_price_offers"


class ProductCreate(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    condition_rating: int = Field(ge=1, le=5)
    price: float = Field(gt=0)
    selling_type: SellingType = SellingType.fixed_price


class ProductUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=100)
    description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    condition_rating: Optional[int] = Field(default=None, ge=1, le=5)
    price: Optional[float] = Field(default=None, gt=0)
    selling_type: Optional[SellingType] = None


class ProductResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    condition_rating: int
    price: float
    selling_type: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True