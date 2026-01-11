# src/ingestion/binance_client.py

import asyncio
import json
import time
from typing import AsyncIterator, Optional
import websockets
from websockets.exceptions import ConnectionClosed, WebSocketException
import structlog

# Assuming your L2Update model looks like this
# Adjust import based on your actual structure
from dataclasses import dataclass

@dataclass
class L2Update:
    """Level-2 order book update."""
    timestamp: int      # Unix milliseconds
    price: float
    quantity: float
    side: str          # 'bid' or 'ask'
    level: int         # Depth level (0 = best)
    update_id: int     # Monotonic sequence ID

log = structlog.get_logger()


class BinanceWebSocketClient:
    """
    Real-time Binance order book depth stream client.
    
    Connects to Binance WebSocket API and streams Level-2 order book updates.
    Handles reconnection, error recovery, and message parsing.
    
    Stream format: btcusdt@depth@100ms
    - Sends differential updates every 100ms
    - Each message contains bid/ask updates
    - Quantity of 0 means remove that price level
    
    Example usage:
        client = BinanceWebSocketClient(symbol="btcusdt")
        async for updates in client.stream_updates():
            for update in updates:
                print(f"{update.side} @ {update.price}: {update.quantity}")
    """
    
    def __init__(
        self,
        symbol: str = "btcusdt",
        update_speed: str = "100ms",
        max_reconnect_attempts: int = 5,
        reconnect_delay: float = 2.0,
    ):
        """
        Initialize Binance WebSocket client.
        
        Args:
            symbol: Trading pair (e.g., 'btcusdt', 'ethusdt')
            update_speed: Update frequency ('100ms' or '1000ms')
            max_reconnect_attempts: Max reconnection tries
            reconnect_delay: Seconds to wait between reconnects
        """
        self.symbol = symbol.lower()
        self.update_speed = update_speed
        self.max_reconnect_attempts = max_reconnect_attempts
        self.reconnect_delay = reconnect_delay
        
        # WebSocket URL
        self.ws_url = (
            f"wss://stream.binance.com:9443/ws/"
            f"{self.symbol}@depth@{self.update_speed}"
        )
        
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.is_connected = False
        self.reconnect_count = 0
        
        # Statistics
        self.messages_received = 0
        self.last_update_id = None
        self.connection_start_time = None
        
    async def connect(self) -> bool:
        """
        Establish WebSocket connection to Binance.
        
        Returns:
            True if connected successfully, False otherwise
        """
        try:
            log.info(
                "connecting_to_binance",
                url=self.ws_url,
                attempt=self.reconnect_count + 1,
            )
            
            self.websocket = await websockets.connect(
                self.ws_url,
                ping_interval=20,  # Send ping every 20s
                ping_timeout=10,   # Wait 10s for pong
                close_timeout=5,
            )
            
            self.is_connected = True
            self.connection_start_time = time.time()
            self.reconnect_count = 0
            
            log.info("connected_to_binance", symbol=self.symbol)
            return True
            
        except Exception as e:
            log.error("connection_failed", error=str(e), attempt=self.reconnect_count)
            self.is_connected = False
            return False
    
    async def reconnect(self) -> bool:
        """
        Attempt to reconnect with exponential backoff.
        
        Returns:
            True if reconnected successfully, False if max attempts exceeded
        """
        self.reconnect_count += 1
        
        if self.reconnect_count > self.max_reconnect_attempts:
            log.error(
                "max_reconnect_attempts_exceeded",
                attempts=self.reconnect_count,
            )
            return False
        
        # Exponential backoff
        delay = self.reconnect_delay * (2 ** (self.reconnect_count - 1))
        delay = min(delay, 60)  # Cap at 60 seconds
        
        log.warning(
            "reconnecting",
            attempt=self.reconnect_count,
            delay_seconds=delay,
        )
        
        await asyncio.sleep(delay)
        return await self.connect()
    
    def _parse_message(self, message: dict) -> list[L2Update]:
        """
        Parse Binance depth update message into L2Update objects.
        
        Message format:
        {
            "e": "depthUpdate",
            "E": 1234567890,     // Event time (ms)
            "s": "BTCUSDT",
            "U": 157,            // First update ID
            "u": 160,            // Last update ID
            "b": [               // Bids
                ["0.0024", "10"],
                ...
            ],
            "a": [               // Asks
                ["0.0026", "100"],
                ...
            ]
        }
        
        Args:
            message: Parsed JSON message from Binance
            
        Returns:
            List of L2Update objects
        """
        timestamp = message['E']  # Event time in milliseconds
        update_id = message['u']  # Last update ID
        
        self.last_update_id = update_id
        
        updates = []
        
        # Parse bids
        bids = message.get('b', [])
        for level, (price_str, qty_str) in enumerate(bids):
            updates.append(L2Update(
                timestamp=timestamp,
                price=float(price_str),
                quantity=float(qty_str),
                side='bid',
                level=level,
                update_id=update_id,
            ))
        
        # Parse asks
        asks = message.get('a', [])
        for level, (price_str, qty_str) in enumerate(asks):
            updates.append(L2Update(
                timestamp=timestamp,
                price=float(price_str),
                quantity=float(qty_str),
                side='ask',
                level=level,
                update_id=update_id,
            ))
        
        return updates
    
    async def stream_updates(self) -> AsyncIterator[list[L2Update]]:
        """
        Stream L2 updates from Binance WebSocket.
        
        Yields:
            List of L2Update objects (one message may contain multiple levels)
            
        Raises:
            ConnectionError: If unable to connect after max attempts
        """
        # Initial connection
        if not self.is_connected:
            connected = await self.connect()
            if not connected:
                raise ConnectionError("Failed to connect to Binance WebSocket")
        
        while True:
            try:
                # Receive message
                message_raw = await self.websocket.recv()
                message = json.loads(message_raw)
                
                self.messages_received += 1
                
                # Log every 1000 messages
                if self.messages_received % 1000 == 0:
                    uptime = time.time() - self.connection_start_time
                    log.info(
                        "stream_stats",
                        messages=self.messages_received,
                        uptime_seconds=int(uptime),
                        last_update_id=self.last_update_id,
                    )
                
                # Parse and yield updates
                updates = self._parse_message(message)
                
                if updates:  # Only yield if there are updates
                    yield updates
                
            except ConnectionClosed as e:
                log.warning(
                    "connection_closed",
                    code=e.code,
                    reason=e.reason,
                )
                
                # Attempt reconnection
                reconnected = await self.reconnect()
                if not reconnected:
                    raise ConnectionError("Failed to reconnect to Binance")
                
            except WebSocketException as e:
                log.error("websocket_error", error=str(e))
                
                # Attempt reconnection
                reconnected = await self.reconnect()
                if not reconnected:
                    raise ConnectionError("WebSocket error, reconnection failed")
                
            except json.JSONDecodeError as e:
                log.error("json_decode_error", error=str(e), raw_message=message_raw[:100])
                # Skip malformed message, continue streaming
                continue
                
            except Exception as e:
                log.error("unexpected_error", error=str(e), error_type=type(e).__name__)
                # Re-raise unexpected errors
                raise
    
    async def close(self):
        """Close WebSocket connection gracefully."""
        if self.websocket and self.is_connected:
            await self.websocket.close()
            self.is_connected = False
            
            log.info(
                "disconnected_from_binance",
                total_messages=self.messages_received,
                last_update_id=self.last_update_id,
            )
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()


# Quick test function
async def test_stream():
    """Test the Binance WebSocket client."""
    client = BinanceWebSocketClient(symbol="btcusdt", update_speed="100ms")
    
    try:
        count = 0
        async for updates in client.stream_updates():
            print(f"\n=== Message {count + 1} ===")
            print(f"Received {len(updates)} level updates")
            
            # Show first 3 updates
            for update in updates[:3]:
                print(f"  {update.side.upper():4} @ ${update.price:>10.2f} = {update.quantity:>8.5f}")
            
            count += 1
            if count >= 10:  # Stop after 10 messages
                break
                
    finally:
        await client.close()


if __name__ == "__main__":
    # Run test
    asyncio.run(test_stream())