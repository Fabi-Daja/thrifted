from sqlalchemy.orm import Session
from starlette.exceptions import HTTPException
from starlette import status
import uuid

from app.models.order import Order
from app.models.review import Review


def create_review(
    db: Session,
    order_id: uuid.UUID,
    current_user_id: uuid.UUID,
    rating: int,
    comment: str | None = None,
) -> Review:
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.buyer_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the buyer of this order can leave a review",
        )

    if order.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must be completed before it can be reviewed",
        )

    existing = db.query(Review).filter(Review.order_id == order_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This order has already been reviewed",
        )

    review = Review(
        order_id=order.id,
        reviewer_id=order.buyer_id,
        reviewee_id=order.seller_id,
        rating=rating,
        comment=comment,
    )

    db.add(review)
    db.commit()
    db.refresh(review)
    return review

from sqlalchemy import func
from app.models.review import Review


def get_user_reviews(db: Session, user_id: uuid.UUID) -> list[Review]:
    return (
        db.query(Review)
        .filter(Review.reviewee_id == user_id)
        .order_by(Review.created_at.desc())
        .all()
    )


def get_user_average_rating(db: Session, user_id: uuid.UUID) -> float | None:
    result = (
        db.query(func.avg(Review.rating))
        .filter(Review.reviewee_id == user_id)
        .scalar()
    )
    return round(float(result), 2) if result is not None else None