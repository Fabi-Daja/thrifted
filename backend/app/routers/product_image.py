import logging
import uuid
import cloudinary.uploader
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core import cloudinary_config  # noqa: F401 - inicializon Cloudinary
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.user import User
from app.schemas.product_image import ProductImageResponse
from app.services.image_embedding_service import generate_embedding_for_image

logger = logging.getLogger("thrifted.image_embeddings")

router = APIRouter(tags=["Product Images"])

MAX_IMAGES_PER_PRODUCT = 10


def get_owned_product(product_id: uuid.UUID, current_user: User, db: Session) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produkti s'u gjet")
    if product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="S'ke të drejtë mbi këtë produkt")
    return product


@router.post("/products/{product_id}/images", response_model=list[ProductImageResponse], status_code=status.HTTP_201_CREATED)
async def upload_product_images(
    product_id: uuid.UUID,
    files: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_owned_product(product_id, current_user, db)

    existing_count = db.query(ProductImage).filter(ProductImage.product_id == product_id).count()

    if existing_count + len(files) > MAX_IMAGES_PER_PRODUCT:
        raise HTTPException(
            status_code=400,
            detail=f"Maksimumi {MAX_IMAGES_PER_PRODUCT} foto për produkt (ke tashmë {existing_count}, po provon të shtosh {len(files)})"
        )

    new_images = []
    next_index = existing_count

    for file in files:
        upload_result = cloudinary.uploader.upload(file.file, folder="thrifted_products")

        new_image = ProductImage(
            product_id=product_id,
            url=upload_result["secure_url"],
            order_index=next_index,
        )
        db.add(new_image)
        new_images.append(new_image)
        next_index += 1

    db.commit()
    for image in new_images:
        db.refresh(image)

    # §5.3 - gjenero embedding automatikisht per çdo foto te re (visual search).
    # E QELLIMSHME qe s'e prish upload-in nese dështon (Voyage poshte, kredite
    # mbaruar, etj.) - foto/produkti mbeten te vlefshme pa u shfaqur ne
    # kerkimin me ngjashmeri vizuale deri sa embedding-u te rigjenerohet
    # (backfill script mund ta plotesoje me vone). Commit PER FOTO - nese njera
    # deshton, s'duhet te terheqe mbrapsht (rollback) embeddings e suksesshme
    # te fotove te tjera te ketij te njejti upload.
    for image in new_images:
        try:
            await generate_embedding_for_image(db, image)
            db.commit()
        except Exception:
            logger.warning("image_embedding_generation_failed image_id=%s", image.id, exc_info=True)
            db.rollback()

    return new_images


@router.delete("/products/{product_id}/images", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_images(
    product_id: uuid.UUID,
    image_ids: list[uuid.UUID],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_owned_product(product_id, current_user, db)

    images = db.query(ProductImage).filter(
        ProductImage.product_id == product_id,
        ProductImage.id.in_(image_ids)
    ).all()

    if len(images) != len(image_ids):
        raise HTTPException(status_code=404, detail="Një ose më shumë foto s'u gjetën")

    for image in images:
        db.delete(image)

    db.commit()