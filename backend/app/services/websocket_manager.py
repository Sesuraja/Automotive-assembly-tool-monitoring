import json
from typing import Dict, List, Set, Optional
from fastapi import WebSocket

class WebSocketManager:
    """
    Multi-tenant real-time live telemetry WebSocket manager.
    Ensures subscribers only receive data for their authorized company/scope.
    """
    def __init__(self):
        # company_id -> list of active websockets
        self._active_connections: Dict[str, List[WebSocket]] = {}
        # Global super admin connections
        self._super_admin_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, company_id: Optional[str] = None, is_super: bool = False):
        await websocket.accept()
        if is_super:
            self._super_admin_connections.append(websocket)
        elif company_id:
            if company_id not in self._active_connections:
                self._active_connections[company_id] = []
            self._active_connections[company_id].append(websocket)

    def disconnect(self, websocket: WebSocket, company_id: Optional[str] = None, is_super: bool = False):
        if is_super and websocket in self._super_admin_connections:
            self._super_admin_connections.remove(websocket)
        elif company_id and company_id in self._active_connections:
            if websocket in self._active_connections[company_id]:
                self._active_connections[company_id].remove(websocket)

    async def broadcast_to_company(self, company_id: str, message: dict):
        payload = json.dumps(message, default=str)
        # Send to company clients
        if company_id in self._active_connections:
            dead_sockets = []
            for ws in self._active_connections[company_id]:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead_sockets.append(ws)
            for ws in dead_sockets:
                self._active_connections[company_id].remove(ws)

        # Also broadcast to active super admins
        dead_supers = []
        for ws in self._super_admin_connections:
            try:
                await ws.send_text(payload)
            except Exception:
                dead_supers.append(ws)
        for ws in dead_supers:
            self._super_admin_connections.remove(ws)

ws_manager = WebSocketManager()
