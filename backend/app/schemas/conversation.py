import uuid
from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.bid import BidResponse


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_id: uuid.UUID
    content: str
    bid_id: uuid.UUID | None
    is_read: bool
    created_at: datetime
    bid: BidResponse | None = None

    class Config:
        from_attributes = True


class ConversationParticipant(BaseModel):
    id: uuid.UUID
    username: str
    full_name: str | None = None
    profile_photo_url: str | None = None

    class Config:
        from_attributes = True


class ConversationProduct(BaseModel):
    id: uuid.UUID
    title: str
    price: float
    status: str

    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    product_id: uuid.UUID


class ConversationResponse(BaseModel):
    id: uuid.UUID
    product: ConversationProduct
    counterparty: ConversationParticipant
    last_message: MessageResponse | None = None
    unread_count: int = 0
    is_seller: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
