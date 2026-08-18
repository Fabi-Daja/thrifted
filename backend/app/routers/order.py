from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.product import Product
from app.models.user import User
from app.schemas.payment import CheckoutSessionResponse
from app.services import payment_service

router = APIRouter(
    prefix="/products",
    tags=["Buying System"]
)


@router.post(
    "/{product_id}/checkout-session",
    response_model=CheckoutSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product_checkout_session(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fillon pagesën reale me Stripe për blerje me çmim fiks (buy-now).
    Porosia (Order) NUK krijohet këtu - krijohet vetëm pasi Stripe konfirmon
    pagesën (shih app/routers/payment.py: confirm + webhook).
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produkti nuk u gjet.")

    session = payment_service.create_checkout_session_for_product(db, product, current_user)
    return CheckoutSessionResponse(checkout_url=session.url, session_id=session.id)
