# app/routers/reviews.py
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewResponse
from app.services.review_service import create_review, get_user_reviews, get_user_average_rating

router = APIRouter(prefix="/orders/{order_id}/reviews", tags=["reviews"])


@router.post("", response_model=ReviewResponse)
def submit_review(
    order_id: uuid.UUID,
    review_in: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_review(
        db=db,
        order_id=order_id,
        current_user_id=current_user.id,
        rating=review_in.rating,
        comment=review_in.comment,
    )

# Krijo router të dytë, ose shto pa prefix te ai ekzistues
review_public_router = APIRouter(prefix="/users/{user_id}/reviews", tags=["reviews"])


@review_public_router.get("", response_model=list[ReviewResponse])
def list_user_reviews(user_id: uuid.UUID, db: Session = Depends(get_db)):
    return get_user_reviews(db, user_id)


@review_public_router.get("/average", response_model=dict)
def user_average_rating(user_id: uuid.UUID, db: Session = Depends(get_db)):
    avg = get_user_average_rating(db, user_id)
    return {"user_id": user_id, "average_rating": avg}