from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user_optional
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import get_chat_response

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    chat_request: ChatRequest,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Auth opsionale: guest vazhdon me tools publike; nese ka JWT valid,
    useri merr edhe tools qe prekin te dhena personale (favoritet, porosite,
    oferta, biseda, njoftime). Rate-limiting (per user_id ose per IP per guest)
    behet brenda get_chat_response."""
    client_ip = http_request.client.host if http_request.client else "unknown"
    reply, products = await get_chat_response(chat_request.messages, db, current_user, client_ip)
    return ChatResponse(reply=reply, products=products)
