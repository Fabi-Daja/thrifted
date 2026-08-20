from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.ws_manager import manager
from app.models.user import User

router = APIRouter(tags=["Realtime"])


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str,
    db: Session = Depends(get_db),
):
    """
    Një lidhje WebSocket për user - shërben vetëm si kanal push nga serveri
    (njoftime + mesazhe chat në kohë reale). Shkrimet (dërgimi i mesazheve,
    krijimi i ofertave, etj.) vazhdojnë të bëhen përmes REST-it ekzistues;
    kjo lidhje thjesht i njofton klientët kur diçka ndryshon.

    Autentikimi bëhet me JWT si query param (`?token=...`), sepse browser-i
    s'lejon header-a të personalizuar te handshake-i i WebSocket-it.
    """
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=4401)
        return

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        await websocket.close(code=4401)
        return

    user_id = str(user.id)
    await manager.connect(user_id, websocket)
    try:
        while True:
            # S'presim komanda nga klienti - vetëm e mbajmë lidhjen të hapur.
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(user_id, websocket)
