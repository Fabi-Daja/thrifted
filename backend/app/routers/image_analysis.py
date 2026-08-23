from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.image_analysis import ImageAnalysisResult
from app.services.image_analysis_service import analyze_product_images

router = APIRouter(tags=["AI"])

MAX_ANALYSIS_IMAGES = 5  # mbrojtje kostosh - s'ka kuptim me shume se disa kende te te njejtit artikull


@router.post("/ai/analyze-image", response_model=ImageAnalysisResult)
async def analyze_image(
    files: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
):
    """US-50 (§5.2). Qasje 'User' (duhet i loguar - njesoj si upload i fotove te
    nje produkti real, Faza 1). Merr 1-N foto TE TE NJEJTIT artikull (para se
    produkti te krijohet - s'ka product_id ende), kthen fusha te sugjeruara per
    formen 'Create Product'. Te gjitha fushat mbeten te modifikueshme nga useri."""
    if len(files) > MAX_ANALYSIS_IMAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Maksimumi {MAX_ANALYSIS_IMAGES} foto per analize.",
        )

    images = [(await file.read(), file.content_type) for file in files]
    result = await analyze_product_images(images)
    return ImageAnalysisResult(**result)
