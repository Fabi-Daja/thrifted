from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
import uuid

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter(prefix="/products", tags=["Products"])


from typing import Literal
from sqlalchemy import or_

@router.get("", response_model=list[ProductResponse])
def get_products(
    db: Session = Depends(get_db),
    category: str | None = None,
    brand: str | None = None,
    size: str | None = None,
    condition_rating: int | None = None,
    price_min: float | None = None,
    price_max: float | None = None,
    q: str | None = None,
    sort: Literal["price_asc", "price_desc", "newest"] | None = None,
    page: int = 1,
    page_size: int = 20,
):
    query = db.query(Product).options(selectinload(Product.images)).filter(Product.status == "active")

    if category:
        query = query.filter(Product.category == category)

    if brand:
        query = query.filter(Product.brand == brand)

    if size:
        query = query.filter(Product.size == size)

    if condition_rating is not None:
        query = query.filter(Product.condition_rating >= condition_rating)

    if price_min is not None:
        query = query.filter(Product.price >= price_min)

    if price_max is not None:
        query = query.filter(Product.price <= price_max)

    if q:
        query = query.filter(
            or_(
                Product.title.ilike(f"%{q}%"),
                Product.description.ilike(f"%{q}%"),
            )
        )

    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort == "newest":
        query = query.order_by(Product.created_at.desc())

    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)  # kufizim maksimal 100/page

    products = query.offset((page - 1) * page_size).limit(page_size).all()
    return products

@router.post("",response_model=ProductResponse,status_code=status.HTTP_201_CREATED)
def create_product(data:ProductCreate,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    
    new_product=Product(**data.model_dump(),owner_id=current_user.id)
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.get("/{product_id}",response_model=ProductResponse)
def get_product(product_id:uuid.UUID,db:Session=Depends(get_db)):
    product=db.query(Product).options(selectinload(Product.images)).filter(Product.id==product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Product not found")
    return product

@router.patch("/{product_id}",response_model=ProductResponse)
def updated_product(product_id:uuid.UUID,data:ProductUpdate,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    product=db.query(Product).filter(Product.id==product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Product not found")
    if product.owner_id!=current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Not authorized to update this product")
    for key,value in data.model_dump(exclude_unset=True).items():
        setattr(product,key,value)
    db.commit()
    db.refresh(product)
    return product

@router.patch("/{product_id}/archieve",response_model=ProductResponse)
def archieve_product(product_id:uuid.UUID,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    product_archived=db.query(Product).filter(Product.id==product_id).first()
    if not product_archived:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Product not found")
    if product_archived.owner_id!=current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Not authorized to archieve this product")
    product_archived.status="archived"
    db.commit()
    db.refresh(product_archived)    
    return product_archived

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product_deleted = db.query(Product).filter(Product.id == product_id).first()
    if not product_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if product_deleted.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this product")
    db.delete(product_deleted)
    db.commit()