import asyncio

from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

from .routers.auth import router as auth_router
from .routers.users import router as users_router
from .routers.product import router as products_router
from .routers.favorite import router as favorites_router
from .routers.bid import router as bid_router
from .routers.order import router as order_router
from .routers.product_image import router as product_images_router
from .routers.review import router as reviews_router, review_public_router
from .routers.chat import router as chat_router
from .routers.payment import router as payment_router
from .routers.notification import router as notification_router
from .routers.conversation import router as conversation_router
from .routers.ws import router as ws_router
from .core.ws_manager import manager as ws_manager
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()


@app.on_event("startup")
async def register_ws_loop() -> None:
    """I duhet ws_manager-it referenca e event loop-it kryesor që kodi sinkron
    (routers/services ekzistues) të mund t'i shtyjë event-e WebSocket në mënyrë
    thread-safe (shih app/core/ws_manager.py)."""
    ws_manager.set_loop(asyncio.get_running_loop())

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(products_router)
app.include_router(favorites_router)
app.include_router(bid_router)
app.include_router(order_router)
app.include_router(product_images_router)
app.include_router(reviews_router)
app.include_router(review_public_router)
app.include_router(chat_router)
app.include_router(payment_router)
app.include_router(notification_router)
app.include_router(conversation_router)
app.include_router(ws_router)

@app.get("/")
def read_root():
    
    
    return {"message": "Thrifted API po punon!"}