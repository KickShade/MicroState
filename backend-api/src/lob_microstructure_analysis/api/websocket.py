# src/lob_microstructure_analysis/api/websocket.py
"""
WebSocket connection manager for real-time streaming.
"""

from fastapi import WebSocket
from typing import List
import json


class WebSocketManager:
    """
    Manages WebSocket connections and broadcasts updates.
    
    Handles:
    - Connection lifecycle
    - Broadcast to all clients
    - Automatic cleanup of dead connections
    """
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"✅ WebSocket connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove disconnected WebSocket."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"❌ WebSocket disconnected. Total: {len(self.active_connections)}")
    
    async def broadcast(self, message: dict):
        """
        Broadcast message to all connected clients.
        
        Automatically removes dead connections.
        
        Args:
            message: Dictionary to send as JSON
        """
        if not self.active_connections:
            return
        
        dead_connections = []
        
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error sending to client: {e}")
                dead_connections.append(connection)
        
        # Clean up dead connections
        for connection in dead_connections:
            self.disconnect(connection)
    
    async def send_to(self, websocket: WebSocket, message: dict):
        """
        Send message to specific client.
        
        Args:
            websocket: Target WebSocket connection
            message: Dictionary to send as JSON
        """
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending to specific client: {e}")
            self.disconnect(websocket)