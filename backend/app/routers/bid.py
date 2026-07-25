import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.bid import Bid
from app.models.product import Product
from app.models.user import User
from app.schemas.bid import BidCreate, BidResponse

router = APIRouter(tags=["Bids"])


# 1. Bën ofertë për një produkt
@router.post("/products/{product_id}/bids", response_model=BidResponse, status_code=status.HTTP_201_CREATED)
def create_bid(
    product_id: uuid.UUID,
    data: BidCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produkti s'u gjet")

    if product.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="S'mund të bësh ofertë për produktin tënd")
    
    if product.selling_type == "fixed_price":
        raise HTTPException(
            status_code=400,
            detail="Ky produkt s'lejon oferta, vetëm blerje me çmim fiks")

    new_bid = Bid(
        product_id=product_id,
        bidder_id=current_user.id,
        amount=data.amount,
    )
    db.add(new_bid)
    db.commit()
    db.refresh(new_bid)
    return new_bid


# 2. Shiko të gjitha ofertat për një produkt (vetëm Owner i produktit)
@router.get("/products/{product_id}/bids", response_model=list[BidResponse])
def get_bids_for_product(
    product_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produkti s'u gjet")

    if product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="S'ke të drejtë të shohësh ofertat e këtij produkti")

    bids = db.query(Bid).filter(Bid.product_id == product_id).all()
    return bids


# 3. Shiko ofertat e mia (si bidder)
@router.get("/users/me/bids", response_model=list[BidResponse])
def get_my_bids(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bids = db.query(Bid).filter(Bid.bidder_id == current_user.id).all()
    return bids


# 4. Prano ofertë (Owner i produktit)
@router.patch("/bids/{bid_id}/accept", response_model=BidResponse)
def accept_bid(
    bid_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Oferta s'u gjet")

    product = db.query(Product).filter(Product.id == bid.product_id).first()

    if product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="S'ke të drejtë të pranosh këtë ofertë")

    bid.status = "accepted"
    product.status = "reserved"

    other_bids = db.query(Bid).filter(
        Bid.product_id == bid.product_id,
        Bid.id != bid_id,
        Bid.status == "pending"
    ).all()
    for other_bid in other_bids:
        other_bid.status = "rejected"

    db.commit()
    db.refresh(bid)
    return bid


# 5. Refuzo ofertë (Owner i produktit)
@router.patch("/bids/{bid_id}/reject", response_model=BidResponse)
def reject_bid(
    bid_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Oferta s'u gjet")

    product = db.query(Product).filter(Product.id == bid.product_id).first()
    if product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="S'ke të drejtë të refuzosh këtë ofertë")

    if bid.status != "pending":
        raise HTTPException(status_code=400, detail="Vetëm ofertat në pritje mund të refuzohen")

    bid.status = "rejected"
    db.commit()
    db.refresh(bid)
    return bid

# 6. Anulo ofertën time (vetëm Bidder)
@router.delete("/bids/{bid_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_bid(
    bid_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Oferta s'u gjet")

    if bid.bidder_id != current_user.id:
        raise HTTPException(status_code=403, detail="S'mund të anulosh ofertën e dikujt tjetër")

    if bid.status != "pending":
        raise HTTPException(status_code=400, detail="Vetëm ofertat në pritje mund të anulohen")

    db.delete(bid)
    db.commit()