import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
)
from app.services import conversation_service, notification_service

router = APIRouter(prefix="/conversations", tags=["Conversations"])


def _to_conversation_dict(db: Session, conversation: Conversation, current_user_id: uuid.UUID) -> dict:
    counterparty = conversation.seller if conversation.buyer_id == current_user_id else conversation.buyer
    last_message = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.desc())
        .first()
    )
    unread_count = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation.id,
            Message.sender_id != current_user_id,
            Message.is_read.is_(False),
        )
        .count()
    )
    return {
        "id": conversation.id,
        "product": conversation.product,
        "counterparty": counterparty,
        "last_message": last_message,
        "unread_count": unread_count,
        "is_seller": conversation.seller_id == current_user_id,
        "created_at": conversation.created_at,
    }


def _get_conversation_or_403(db: Session, conversation_id: uuid.UUID, current_user: User) -> Conversation:
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Biseda s'u gjet")
    if current_user.id not in (conversation.buyer_id, conversation.seller_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="S'ke të drejtë ta shohësh këtë bisedë")
    return conversation


# 1. Nis (ose gjej) bisedën për një produkt
@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = conversation_service.get_or_create_conversation(db, data.product_id, current_user.id)
    db.commit()
    db.refresh(conversation)
    return _to_conversation_dict(db, conversation, current_user.id)


# 2. Lista e bisedave të mia (si blerës ose shitës), më të fundit së pari
@router.get("", response_model=list[ConversationResponse])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversations = (
        db.query(Conversation)
        .filter(
            (Conversation.buyer_id == current_user.id) | (Conversation.seller_id == current_user.id)
        )
        .all()
    )
    results = [_to_conversation_dict(db, c, current_user.id) for c in conversations]
    results.sort(
        key=lambda r: r["last_message"].created_at if r["last_message"] else r["created_at"],
        reverse=True,
    )
    return results


# 3. Detajet e një bisede të vetme (produkti, pala tjetër, palexuarat)
@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = _get_conversation_or_403(db, conversation_id, current_user)
    return _to_conversation_dict(db, conversation, current_user.id)


# 4. Mesazhet e një bisede (dhe shënimi i tyre si të lexuara)
@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
def get_messages(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = _get_conversation_or_403(db, conversation_id, current_user)

    messages = (
        db.query(Message)
        .options(selectinload(Message.bid))
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
        .all()
    )

    db.query(Message).filter(
        Message.conversation_id == conversation.id,
        Message.sender_id != current_user.id,
        Message.is_read.is_(False),
    ).update({"is_read": True})
    db.commit()

    return messages


# 5. Dërgo mesazh të ri
@router.post(
    "/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_message(
    conversation_id: uuid.UUID,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = _get_conversation_or_403(db, conversation_id, current_user)

    message = conversation_service.send_message(db, conversation, current_user.id, data.content)
    notification_service.notify_new_message(db, message, conversation, current_user)

    db.commit()
    db.refresh(message)
    return message
