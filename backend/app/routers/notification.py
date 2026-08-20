import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationResponse, UnreadCountResponse

router = APIRouter(tags=["Notifications"])


# 1. Lista e njoftimeve të mia (më të rejat së pari)
@router.get("/users/me/notifications", response_model=list[NotificationResponse])
def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Notification)
        .filter(Notification.recipient_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )


# 2. Numri i njoftimeve të palexuara (për badge-in te navbar)
@router.get("/users/me/notifications/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = (
        db.query(Notification)
        .filter(Notification.recipient_id == current_user.id, Notification.is_read.is_(False))
        .count()
    )
    return {"count": count}


# 3. Shëno një njoftim si të lexuar
@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Njoftimi s'u gjet")

    if notification.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="S'ke të drejtë ta shohësh këtë njoftim")

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


# 4. Shëno të gjitha njoftimet si të lexuara
@router.patch("/users/me/notifications/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.recipient_id == current_user.id,
        Notification.is_read.is_(False),
    ).update({"is_read": True})
    db.commit()
