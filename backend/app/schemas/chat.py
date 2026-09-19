from pydantic import BaseModel
from typing import List

class ChatMessage(BaseModel):
    role: str        # "user" ose "assistant" - kalohet direkt te Anthropic Messages API
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class ProductCard(BaseModel):
    """Karte produkti e strukturuar, e mbledhur nga rezultatet e tools (search_products,
    get_product_details, get_my_favorites) gjate nje bisede - lejon frontend-in te
    shfaqe karta produkti te klikueshme brenda chat-it, jo vetem tekst te thjeshte."""
    id: str
    title: str | None = None
    price: float | None = None
    category: str | None = None
    brand: str | None = None
    condition_rating: int | None = None
    image_url: str | None = None


class ChatResponse(BaseModel):
    reply: str
    products: list[ProductCard] = []
