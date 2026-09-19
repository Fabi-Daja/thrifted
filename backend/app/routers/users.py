from datetime import datetime, timedelta, timezone

import cloudinary.uploader
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_user_optional
from app.core import cloudinary_config  # noqa: F401 - inicializon Cloudinary
from app.core.security import hash_password, verify_password
from app.core.sms import (
    PHONE_CODE_MAX_ATTEMPTS,
    PHONE_CODE_RESEND_COOLDOWN_SECONDS,
    PHONE_CODE_TTL_MINUTES,
    generate_otp_code,
    send_verification_sms,
)
from app.models.follow import Follow
from app.models.order import Order
from app.models.review import Review
from app.models.user import User
from app.schemas.order import OrderDetailResponse
from app.schemas.phone import SendPhoneCodeRequest, VerifyPhoneCodeRequest
from app.schemas.recommendation import RecommendationResult
from app.schemas.user import UserPrivateResponse, UserResponse, UserUpdate
from app.services import recommendation_service

router = APIRouter(prefix="/users", tags=["Users"])


def _attach_follow_stats(db: Session, user: User, viewer: User | None = None) -> User:
    """Bashkangjit followers_count/following_count/is_following si atribute
    JO-PERSISTENTE mbi objektin User (jo kolona te modelit) - UserResponse
    (from_attributes=True) i lexon si fusha normale ne serializim. Duhet
    thirrur PARA kthimit te çdo endpoint qe perdor UserResponse/
    UserPrivateResponse, perndryshe fushat mbeten 0/None te heshtura (jo
    gabim, por te dhena te gabuara)."""
    user.followers_count = db.query(Follow).filter(Follow.followed_id == user.id).count()
    user.following_count = db.query(Follow).filter(Follow.follower_id == user.id).count()
    user.is_following = (
        db.query(Follow)
        .filter(Follow.follower_id == viewer.id, Follow.followed_id == user.id)
        .first()
        is not None
        if viewer and viewer.id != user.id
        else None
    )
    return user


@router.get("/me", response_model=UserPrivateResponse)
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _attach_follow_stats(db, current_user)


@router.patch("/me", response_model=UserPrivateResponse)
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
    return _attach_follow_stats(db, current_user)


@router.post("/me/avatar", response_model=UserPrivateResponse)
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
    return _attach_follow_stats(db, current_user)


@router.post("/me/phone/send-code", response_model=UserPrivateResponse)
def send_phone_verification_code(
    data: SendPhoneCodeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Gjeneron dhe 'dërgon' (shih app/core/sms.py) një kod OTP 6-shifror per
    verifikimin e numrit të telefonit - gate para postimit të një produkti
    (Thrifted-dizajni.pptx slide 11). Ndryshimi i numrit rinis verifikimin."""
    if current_user.is_phone_verified and current_user.phone_number == data.phone_number:
        raise HTTPException(status_code=400, detail="Ky numër është verifikuar tashmë")

    if current_user.phone_verification_sent_at:
        sent_at = current_user.phone_verification_sent_at
        if sent_at.tzinfo is None:
            sent_at = sent_at.replace(tzinfo=timezone.utc)
        elapsed = datetime.now(timezone.utc) - sent_at
        cooldown = timedelta(seconds=PHONE_CODE_RESEND_COOLDOWN_SECONDS)
        if elapsed < cooldown:
            wait = int((cooldown - elapsed).total_seconds())
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Prit {wait} sekonda para se të kërkosh një kod të ri",
            )

    code = generate_otp_code()
    current_user.phone_number = data.phone_number
    current_user.is_phone_verified = False
    current_user.phone_verification_code_hash = hash_password(code)
    current_user.phone_verification_expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=PHONE_CODE_TTL_MINUTES
    )
    current_user.phone_verification_attempts = 0
    current_user.phone_verification_sent_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)

    try:
        send_verification_sms(data.phone_number, code)
    except Exception:
        # Fail-secure, njësoj si dërgimi i email-it te auth.py: nëse SMS-i
        # dështon (ofrues jashtë linje, etj.), mos e prish kërkesën - useri
        # mund të kërkojë kod të ri pas cooldown-it.
        pass

    return _attach_follow_stats(db, current_user)


@router.post("/me/phone/verify", response_model=UserPrivateResponse)
def verify_phone_code(
    data: VerifyPhoneCodeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.is_phone_verified:
        return _attach_follow_stats(db, current_user)

    if not current_user.phone_verification_code_hash or not current_user.phone_verification_expires_at:
        raise HTTPException(status_code=400, detail="Kërko një kod verifikimi së pari")

    expires_at = current_user.phone_verification_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Kodi ka skaduar - kërko një kod të ri")

    if current_user.phone_verification_attempts >= PHONE_CODE_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Shumë tentativa të gabuara - kërko një kod të ri",
        )

    if not verify_password(data.code, current_user.phone_verification_code_hash):
        current_user.phone_verification_attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Kodi i pasaktë")

    current_user.is_phone_verified = True
    current_user.phone_verification_code_hash = None
    current_user.phone_verification_expires_at = None
    current_user.phone_verification_attempts = 0
    db.commit()
    db.refresh(current_user)
    return _attach_follow_stats(db, current_user)


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


@router.get("/me/recommendations", response_model=list[RecommendationResult])
def get_my_recommendations(
    limit: int = recommendation_service.DEFAULT_RECOMMENDATION_LIMIT,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """§5.5 (faza-5-ai-features.md) - rekomandime personalizuara, content-based
    mbi `product_image_embeddings` (5.3, ripërdorim direkt). Auth e detyrueshme
    (ndryshe nga `search-by-image` që është publik) sepse personalizimi kërkon
    të dihet kush është useri. Cold-start (user pa histori) -> fallback
    'trending'/më të rejat, shih recommendation_service._trending_fallback."""
    limit = min(max(limit, 1), 50)
    results = recommendation_service.get_recommendations(db, current_user.id, limit=limit)
    return [RecommendationResult(**r) for r in results]


@router.get("/{user_id}", response_model=UserResponse)
def get_public_profile(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User s'u gjet")
    return _attach_follow_stats(db, user, viewer=current_user)


@router.post("/{user_id}/follow", response_model=UserResponse)
def follow_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ndiq nje shites - idempotente (thirrje e dyte s'krijon rresht te dyte,
    as s'kthen gabim), ndryshe nga POST /favorites/{id} (kthen 404 nese
    ekziston tashme - shih ResponseValidationError-in e njohur atje, gap i
    pa-lidhur, flag-uar veças). Ketu preferohet toggle-safe per UX me te mire."""
    if str(current_user.id) == str(user_id):
        raise HTTPException(status_code=400, detail="S'mund të ndjekësh veten")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User s'u gjet")

    existing = (
        db.query(Follow)
        .filter(Follow.follower_id == current_user.id, Follow.followed_id == target.id)
        .first()
    )
    if not existing:
        db.add(Follow(follower_id=current_user.id, followed_id=target.id))
        db.commit()

    return _attach_follow_stats(db, target, viewer=current_user)


@router.delete("/{user_id}/follow", response_model=UserResponse)
def unfollow_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User s'u gjet")

    existing = (
        db.query(Follow)
        .filter(Follow.follower_id == current_user.id, Follow.followed_id == target.id)
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()

    return _attach_follow_stats(db, target, viewer=current_user)