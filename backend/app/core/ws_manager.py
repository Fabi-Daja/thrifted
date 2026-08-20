"""
Menaxher i thjeshtë WebSocket në memorje - mban lidhjet aktive për user_id dhe
u dërgon event-e live (njoftime + mesazhe chat).

Shumica e router-ave/services ekzistues (bid.py, payment_service.py,
review_service.py) janë sinkronë (def, jo async def) dhe ekzekutohen në
threadpool nga FastAPI. `push()` është krijuar pikërisht për t'u thirrur nga
kod i tillë sinkron: planifikon dërgimin real (async) te event loop kryesor
me `run_coroutine_threadsafe`, pa kërkuar rishkrimin e krejt zinxhirit në async.
"""
import asyncio
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = {}
        self._loop: asyncio.AbstractEventLoop | None = None

    def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    async def connect(self, user_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self._connections.setdefault(user_id, set()).add(ws)

    def disconnect(self, user_id: str, ws: WebSocket) -> None:
        conns = self._connections.get(user_id)
        if not conns:
            return
        conns.discard(ws)
        if not conns:
            self._connections.pop(user_id, None)

    async def _send_to_user(self, user_id: str, payload: dict[str, Any]) -> None:
        conns = list(self._connections.get(user_id, ()))
        for ws in conns:
            try:
                await ws.send_json(payload)
            except Exception:
                self.disconnect(user_id, ws)

    def push(self, user_id: str, payload: dict[str, Any]) -> None:
        """Dërgo një event te user_id nga kod sinkron. No-op nëse loop-i s'është
        nisur ende (p.sh. gjatë testeve) ose useri s'ka lidhje aktive."""
        if self._loop is None:
            return
        asyncio.run_coroutine_threadsafe(self._send_to_user(user_id, payload), self._loop)


manager = ConnectionManager()
