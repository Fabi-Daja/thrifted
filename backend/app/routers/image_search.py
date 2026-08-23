from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.image_search import ImageSearchResult
from app.services.image_embedding_service import search_by_image

router = APIRouter(tags=["AI"])

_SUPPORTED_MEDIA_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


@router.post("/ai/search-by-image", response_model=list[ImageSearchResult])
async def search_by_image_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """US-51 (§5.3). Qasje 'Guest/User' sipas API contract origjinal - kerkim
    publik, njesoj si `search_products` (5.1), s'kerkon auth."""
    if file.content_type not in _SUPPORTED_MEDIA_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Formati '{file.content_type}' s'mbeshtetet. Perdor JPEG, PNG, GIF ose WEBP.",
        )

    image_bytes = await file.read()
    results = await search_by_image(db, image_bytes, file.content_type)
    return [ImageSearchResult(**r) for r in results]
