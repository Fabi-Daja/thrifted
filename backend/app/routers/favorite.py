import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.favorite import Favorite
from app.models.user import User
from app.schemas.favorite import FavoriteMessageResponse, FavoriteResponse
from app.services import recommendation_service

router = APIRouter(prefix="/favorites", tags=["Favorites"])

@router.post("/{product_id}", response_model=FavoriteMessageResponse)
def add_favorite(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing=db.query(Favorite).filter(Favorite.user_id==current_user.id,Favorite.product_id==product_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Produkti eshte tashme i zgjedhur ne listen e favorites")
    new_favorite = Favorite(user_id=current_user.id, product_id=product_id)
    db.add(new_favorite)
    recommendation_service.log_interaction(db, current_user.id, product_id, "favorite")  # §5.5
    db.commit()
    db.refresh(new_favorite)

    return {"message": "U shtua te favoritet"}

@router.get("", response_model=list[FavoriteResponse])
def list_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    favorites = db.query(Favorite).filter(Favorite.user_id == current_user.id).all()
    return favorites

@router.delete("/{product_id}", response_model=FavoriteMessageResponse)
def remove_favorite(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    favorite = db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.product_id == product_id).first()
    if not favorite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produkti nuk u gjet ne listen e favorites")

    db.delete(favorite)
    db.commit()

    return {"message": "U hoq nga favoritet"}