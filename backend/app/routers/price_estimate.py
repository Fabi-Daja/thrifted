from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.price_estimate import EstimatePriceRequest, EstimatePriceResponse
from app.services.price_estimate_service import estimate_price

router = APIRouter(tags=["AI"])


@router.post("/ai/estimate-price", response_model=EstimatePriceResponse)
def estimate_price_endpoint(
    data: EstimatePriceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """US-52 (§5.4). Qasje 'User' sipas API contract origjinal (00-dokumentacion-master.md
    §9) - ndryshe nga tools publike te chat-it (5.1), ku e njejta logjike eshte e
    disponueshme edhe per guest brenda bisedes (vendim i pranuar ne §5.1)."""
    result = estimate_price(db, data.category, data.brand, data.condition_rating)
    return EstimatePriceResponse(
        price_min=result["price_min"],
        price_max=result["price_max"],
        confidence_score=result["confidence"],
        sample_size=result["sample_size"],
        note=result["note"],
    )
