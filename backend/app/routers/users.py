import cloudinary.uploader
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core import cloudinary_config  # noqa: F401 - inicializon Cloudinary
from app.models.order import Order
from app.models.review import Review
from app.models.user import User
from app.schemas.order import OrderDetailResponse
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_my_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    update_data = data.model_dump(exclude_unset=True)

    if "username" in update_data:
        existing = db.query(User).filter(
            User.username == update_data["username"],
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ky username është i zënë")

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/avatar", response_model=UserResponse)
def upload_my_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ngarkon foton e re të profilit te Cloudinary dhe përditëson profile_photo_url."""
    upload_result = cloudinary.uploader.upload(file.file, folder="thrifted_avatars")
    current_user.profile_photo_url = upload_result["secure_url"]
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/me/purchases", response_model=list[OrderDetailResponse])
def get_my_purchases(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Porositë ku useri aktual ishte blerësi - shfaqet te tab-i "Blerjet" te /me."""
    orders = (
        db.query(Order)
        .filter(Order.buyer_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    reviewed_order_ids = {
        r.order_id
        for r in db.query(Review.order_id).filter(
            Review.order_id.in_([o.id for o in orders])
        )
    }
    return [
        {
            "id": o.id,
            "final_price": o.final_price,
            "status": o.status,
            "created_at": o.created_at,
            "product": o.product,
            "counterparty": o.seller,
            "has_review": o.id in reviewed_order_ids,
        }
        for o in orders
    ]


@router.get("/me/sales", response_model=list[OrderDetailResponse])
def get_my_sales(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Porositë ku useri aktual ishte shitësi - shfaqet te tab-i "Shitjet" te /me."""
    orders = (
        db.query(Order)
        .filter(Order.seller_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [
        {
            "id": o.id,
            "final_price": o.final_price,
            "status": o.status,
            "created_at": o.created_at,
            "product": o.product,
            "counterparty": o.buyer,
        }
        for o in orders
    ]


@router.get("/{user_id}", response_model=UserResponse)
def get_public_profile(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User s'u gjet")
    return user