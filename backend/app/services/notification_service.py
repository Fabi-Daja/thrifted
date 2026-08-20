import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core.ws_manager import manager as ws_manager
from app.models.bid import Bid
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.notification import Notification
from app.models.order import Order
from app.models.product import Product
from app.models.user import User


def create_notification(
    db: Session,
    *,
    recipient_id: uuid.UUID,
    type: str,
    message: str,
    actor_id: uuid.UUID | None = None,
    product_id: uuid.UUID | None = None,
    bid_id: uuid.UUID | None = None,
) -> Notification:
    """
    Krijon një njoftim brenda transaksionit të thirrësit (bën vetëm flush, jo
    commit) — kështu njoftimi ruhet atomikisht bashkë me ndryshimin që e shkaktoi
    (p.sh. krijimi i një oferte), pa kërkuar një commit të veçantë. Njofton edhe
    live nëpërmjet WebSocket (nëse recipient-i është i lidhur aktualisht).
    """
    notification = Notification(
        recipient_id=recipient_id,
        actor_id=actor_id,
        type=type,
        message=message,
        product_id=product_id,
        bid_id=bid_id,
    )
    db.add(notification)
    db.flush()

    created_at = notification.created_at or datetime.now(timezone.utc)
    ws_manager.push(
        str(recipient_id),
        {
            "event": "notification",
            "notification": {
                "id": str(notification.id),
                "type": notification.type,
                "message": notification.message,
                "product_id": str(notification.product_id) if notification.product_id else None,
                "bid_id": str(notification.bid_id) if notification.bid_id else None,
                "actor_id": str(notification.actor_id) if notification.actor_id else None,
                "is_read": notification.is_read,
                "created_at": created_at.isoformat(),
            },
        },
    )

    return notification


def notify_bid_created(db: Session, bid: Bid, product: Product, bidder: User) -> None:
    create_notification(
        db,
        recipient_id=product.owner_id,
        actor_id=bidder.id,
        type="bid_created",
        message=f"{bidder.username} bëri një ofertë prej {bid.amount:.2f}€ për '{product.title}'.",
        product_id=product.id,
        bid_id=bid.id,
    )


def notify_bid_accepted(db: Session, bid: Bid, product: Product) -> None:
    create_notification(
        db,
        recipient_id=bid.bidder_id,
        actor_id=product.owner_id,
        type="bid_accepted",
        message=f"Oferta jote prej {bid.amount:.2f}€ për '{product.title}' u pranua! Paguaj për ta finalizuar blerjen.",
        product_id=product.id,
        bid_id=bid.id,
    )


def notify_bid_rejected(db: Session, bid: Bid, product: Product) -> None:
    create_notification(
        db,
        recipient_id=bid.bidder_id,
        actor_id=product.owner_id,
        type="bid_rejected",
        message=f"Oferta jote prej {bid.amount:.2f}€ për '{product.title}' u refuzua.",
        product_id=product.id,
        bid_id=bid.id,
    )


def notify_order_paid(db: Session, order: Order, product: Product) -> None:
    create_notification(
        db,
        recipient_id=order.seller_id,
        actor_id=order.buyer_id,
        type="order_paid",
        message=f"'{product.title}' u shit dhe u pagua! Kontakto blerësin për dërgesën.",
        product_id=product.id,
    )


def notify_new_message(db: Session, message: Message, conversation: Conversation, sender: User) -> None:
    """
    Njofton vetëm për mesazhe të lira (POST /conversations/{id}/messages) - jo
    për mesazhet automatike të gjeneruara nga rrjedha e ofertave, sepse ato
    kanë tashmë njoftimet e tyre specifike (notify_bid_created etj.); dyfishimi
    do të krijonte 2 njoftime për të njëjtin event.
    """
    recipient_id = (
        conversation.seller_id if message.sender_id == conversation.buyer_id else conversation.buyer_id
    )
    create_notification(
        db,
        recipient_id=recipient_id,
        actor_id=sender.id,
        type="message_received",
        message=f"{sender.username} të dërgoi një mesazh të ri.",
        product_id=conversation.product_id,
    )
