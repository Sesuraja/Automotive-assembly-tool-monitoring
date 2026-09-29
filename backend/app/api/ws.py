from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional
from jose import JWTError
from app.core.security import decode_token
from app.services.websocket_manager import ws_manager

router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws/live")
async def live_websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    company_id = None
    is_super = False

    if token:
        try:
            payload = decode_token(token)
            company_id = payload.get("company_id")
            roles = payload.get("roles", [])
            if "SUPER_ADMIN" in roles:
                is_super = True
        except JWTError:
            pass

    await ws_manager.connect(websocket, company_id=company_id, is_super=is_super)
    try:
        while True:
            # Keep socket alive and allow client messages (e.g. ping)
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"type": "pong"}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, company_id=company_id, is_super=is_super)
