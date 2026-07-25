from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.product import Product
from app.models.order import Order
from app.models.user import User
from app.schemas.order import OrderRead

router = APIRouter(
    prefix="/products",
    tags=["Buying System"]
)


@router.post("/{product_id}/buy", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def buy_product_now(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Buy-now endpoint: validates user, product and creates an order."""
    if not current_user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Duhet të verifikoni email-in para se të kryeni blerje."
        )

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produkti nuk u gjet.")

    if product.owner_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nuk mund të blini produktin tuaj."
        )

    # normalize status checks to lowercase values as defined in the model
    if product.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ky produkt nuk mund të blihet sepse është në statusin: {product.status}"
        )

    try:
        product.status = "sold"

        new_order = Order(
            product_id=product.id,
            buyer_id=current_user.id,
            seller_id=product.owner_id,
            final_price=product.price,
            status="completed"
        )

        db.add(new_order)
        db.commit()
        db.refresh(new_order)

        return new_order

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ndodhi një gabim gjatë procesimit të porosisë. Ju lutem provoni përsëri."
        )