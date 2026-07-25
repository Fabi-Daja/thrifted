from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.security import hash_password, create_access_token, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token
from app.core.email import create_email_token, send_verification_email, decode_email_token
from app.core.dependencies import get_current_user
from app.schemas.user import ChangePasswordRequest
from app.schemas.email import ResendRequest
from app.core.security import create_password_reset_token, decode_access_token, hash_password
from app.core.email import send_password_reset_email
from app.schemas.user import ForgotPasswordRequest, ResetPasswordRequest



router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # 1. Kontrollo nëse email ose username ekzistojnë tashmë
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ose username tashmë ekziston"
        )

    # 2. Hash password (kurrë s'ruajmë password të thjeshtë)
    hashed_pw = hash_password(user_data.password)

    # 3. Krijo userin e ri
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=hashed_pw,
        is_email_verified=False,  # aktivizohet vetëm pas verifikimit
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 4. (Placeholder) Këtu më vonë do dërgojmë email verifikimi
    # send_verification_email(new_user.email)
    try:
        token = create_email_token(str(new_user.id))
        send_verification_email(new_user.email, token)
    except Exception:
        # don't fail registration if email sending fails; log in real app
        pass

    return new_user

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ose password i pasaktë"
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Password i vjetër i pasaktë")

    current_user.password_hash = hash_password(data.new_password)
    db.commit()

    return {"message": "Password u ndryshua me sukses"}



@router.post("/resend-verification")
def resend_verification(
    data: ResendRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nuk u gjet")
    if user.is_email_verified:
        return {"message": "Email-i eshte verifikuar tashme"}
    token = create_email_token(str(user.id))
    try:
        send_verification_email(user.email, token)
    except Exception:
        raise HTTPException(status_code=500, detail="Dërgimi i email-it dështoi")
    return {"message": "Email verifikimi u dërgua"}


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    data = decode_email_token(token)
    if not data:
        raise HTTPException(status_code=400, detail="Token i pavlefshëm ose skaduar")
    user = db.query(User).filter(User.id == data.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nuk u gjet")
    if not user.is_email_verified:
        user.is_email_verified = True
        db.commit()
        db.refresh(user)
    return {"message": "Email-i u verifikua me sukses"}

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if user:
        token = create_password_reset_token(str(user.id))
        send_password_reset_email(user.email, token)

    return {"message": "Nëse email ekziston, u dërgua një email me udhëzime"}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    payload = decode_access_token(data.token)

    if not payload or payload.get("purpose") != "password_reset":
        raise HTTPException(status_code=400, detail="Token i pavlefshëm ose i skaduar")

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User s'u gjet")

    user.password_hash = hash_password(data.new_password)
    db.commit()

    return {"message": "Password u rivendos me sukses"}