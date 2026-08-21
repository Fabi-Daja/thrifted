from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

security_scheme = HTTPBearer()
optional_security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)

    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token i pavlefshëm ose i skaduar",
        )

    user = db.query(User).filter(User.id == payload["sub"]).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User s'u gjet",
        )

    return user


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_security_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """Si get_current_user, por kthen None (guest) ne vend te 401 kur s'ka token
    ose token-i eshte i pavlefshem/i skaduar. Per endpoint-e qe duhet te
    funksionojne edhe pa autentikim (p.sh. POST /chat)."""
    if credentials is None:
        return None

    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        return None

    return db.query(User).filter(User.id == payload["sub"]).first()