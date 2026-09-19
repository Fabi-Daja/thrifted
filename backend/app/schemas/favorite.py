from pydantic import BaseModel
from datetime import datetime
from app.schemas.product import ProductResponse


class FavoriteResponse(BaseModel):
    product: ProductResponse
    added_at: datetime

    class Config:
        from_attributes = True


# POST/DELETE /favorites/{id} kthejne vetem nje mesazh konfirmimi (jo listen e
# plote) - me pare deklaronin response_model=list[FavoriteResponse] ndersa
# ktheenin {"message": ...}, duke shkaktuar ResponseValidationError (500) ne
# CDO thirrje te suksesshme (rreshti ruhej ne DB, por API kthente 500 dhe UI
# s'reflektonte kurre ndryshimin - gjetur dhe rregulluar 2026-09-06 duke
# testuar live flow-in e favoriteve, e njohur qe me pare por e pa-rregulluar,
# shih docs/faza/faza-5-ai-features.md).
class FavoriteMessageResponse(BaseModel):
    message: str