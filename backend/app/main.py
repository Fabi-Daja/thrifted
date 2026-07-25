from fastapi import FastAPI

from .routers.auth import router as auth_router
from .routers.users import router as users_router
from .routers.product import router as products_router
from .routers.favorite import router as favorites_router
from .routers.bid import router as bid_router
from .routers.order import router as order_router
from .routers.product_image import router as product_images_router
from .routers.review import router as reviews_router, review_public_router
app = FastAPI()

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(products_router)
app.include_router(favorites_router)
app.include_router(bid_router)
app.include_router(order_router)
app.include_router(product_images_router)
app.include_router(reviews_router)
app.include_router(review_public_router)

@app.get("/")
def read_root():
    
    
    return {"message": "Thrifted API po punon!"}