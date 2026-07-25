import uuid
from pydantic import BaseModel


class ProductImageResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    url: str
    order_index: int

    class Config:
        from_attributes = True

class ImageDeleteRequest(BaseModel):
    image_ids: list[uuid.UUID]