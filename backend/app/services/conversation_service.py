import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.ws_manager import manager as ws_manager
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.product import Product


def get_or_create_conversation(db: Session, product_id: uuid.UUID, buyer_id: uuid.UUID) -> Conversation:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produkti s'u gjet")

    if product.owner_id == buyer_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="S'mund të nisësh bisedë me veten")

    conversation = (
        db.query(Conversation)
        .filter(Conversation.product_id == product_id, Conversation.buyer_id == buyer_id)
        .first()
    )
    if conversation:
        return conversation

    conversation = Conversation(product_id=product_id, buyer_id=buyer_id, seller_id=product.owner_id)
    db.add(conversation)
    db.flush()
    return conversation


def _serialize_message(message: Message) -> dict:
    return {
        "id": str(message.id),
        "conversation_id": str(message.conversation_id),
        "sender_id": str(message.sender_id),
        "content": message.content,
        "bid_id": str(message.bid_id) if message.bid_id else None,
        "is_read": message.is_read,
        "created_at": message.created_at.isoformat() if message.created_at else None,
    }


def send_message(
    db: Session,
    conversation: Conversation,
    sender_id: uuid.UUID,
    content: str,
    bid_id: uuid.UUID | None = None,
) -> Message:
    """Krijon mesazhin dhe e shtyn live (WebSocket) te pala tjetër e bisedës.

    Përdoret edhe nga POST /conversations/{id}/messages (mesazh i lirë), edhe
    nga rrjedha e ofertave (bid.py) - kështu çdo ofertë/pranim/refuzim shfaqet
    automatikisht si mesazh në të njëjtën bisedë.
    """
    message = Message(
        conversation_id=conversation.id,
        sender_id=sender_id,
        content=content,
        bid_id=bid_id,
    )
    db.add(message)
    db.flush()

    recipient_id = (
        conversation.seller_id if sender_id == conversation.buyer_id else conversation.buyer_id
    )
    ws_manager.push(str(recipient_id), {"event": "message", "message": _serialize_message(message)})

    return message
