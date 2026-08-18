from pydantic import BaseModel
from typing import List

class ChatMessage(BaseModel):
    role: str        # "user" ose "model"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class ChatResponse(BaseModel):
    reply: str