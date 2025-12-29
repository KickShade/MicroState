# src/ingestion/data_source.py

from abc import ABC, abstractmethod
from typing import AsyncIterator
from pathlib import Path
import structlog

log = structlog.get_logger()


class DataSource(ABC):
    """
    Abstract interface for L2 order book data sources.
    
    Allows seamless switching between:
    - Offline CSV replay
    - Live WebSocket streams
    - Synthetic data generation
    """
    
    @abstractmethod
    async def stream_updates(self) -> AsyncIterator:
        """
        Stream L2 updates asynchronously.
        
        Yields:
            L2Update objects
        """
        pass
    
    @abstractmethod
    async def close(self):
        """Clean up resources."""
        pass


class ReplayDataSource(DataSource):
    """
    Replay historical L2 data from CSV/Parquet files.
    
    Usage:
        source = ReplayDataSource("data/BTCUSDT_2024-01-15.csv")
        async for update in source.stream_updates():
            process(update)
    """
    
    def __init__(self, file_path: str | Path, speed_multiplier: float = 1.0):
        """
        Initialize replay data source.
        
        Args:
            file_path: Path to CSV/Parquet file
            speed_multiplier: Replay speed (1.0 = real-time, 10.0 = 10x faster)
        """
        self.file_path = Path(file_path)
        self.speed_multiplier = speed_multiplier
        
        if not self.file_path.exists():
            raise FileNotFoundError(f"Data file not found: {file_path}")
        
        log.info(
            "replay_source_initialized",
            file=str(self.file_path),
            speed=f"{speed_multiplier}x",
        )
    
    async def stream_updates(self) -> AsyncIterator:
        """Stream updates from file."""
        # Import here to avoid circular dependencies
        from lob_microstructure_analysis.ingestion.loader import LOBDataLoader
        
        loader = LOBDataLoader(str(self.file_path))
        
        async for update in loader.stream():
            yield update
    
    async def close(self):
        """No resources to clean up for file replay."""
        log.info("replay_source_closed")


class LiveDataSource(DataSource):
    """
    Live Binance WebSocket data source.
    
    Usage:
        source = LiveDataSource(symbol="btcusdt")
        async for update in source.stream_updates():
            process(update)
    """
    
    def __init__(
        self,
        symbol: str = "btcusdt",
        update_speed: str = "100ms",
    ):
        """
        Initialize live data source.
        
        Args:
            symbol: Trading pair (e.g., 'btcusdt', 'ethusdt')
            update_speed: Update frequency ('100ms' or '1000ms')
        """
        from lob_microstructure_analysis.ingestion.binance_client import BinanceWebSocketClient
        
        self.symbol = symbol
        self.update_speed = update_speed
        self.client = BinanceWebSocketClient(
            symbol=symbol,
            update_speed=update_speed,
        )
        
        log.info(
            "live_source_initialized",
            symbol=symbol,
            update_speed=update_speed,
        )
    
    async def stream_updates(self) -> AsyncIterator:
        """
        Stream live updates from Binance.
        
        Note: Binance returns batches of updates (multiple levels per message).
        We flatten this to individual L2Update objects for consistency.
        """
        async for update_batch in self.client.stream_updates():
            # Yield each update individually
            for update in update_batch:
                yield update
    
    async def close(self):
        """Close WebSocket connection."""
        await self.client.close()
        log.info("live_source_closed")


# Factory function for easy instantiation
def create_data_source(
    mode: str,
    symbol: str = "btcusdt",
    file_path: str | None = None,
    **kwargs
) -> DataSource:
    """
    Factory function to create appropriate data source.
    
    Args:
        mode: 'live' or 'replay'
        symbol: Trading pair (for live mode)
        file_path: CSV/Parquet path (for replay mode)
        **kwargs: Additional arguments passed to data source
        
    Returns:
        Configured DataSource instance
        
    Example:
        # Live mode
        source = create_data_source('live', symbol='btcusdt')
        
        # Replay mode
        source = create_data_source('replay', file_path='data/btc.csv')
    """
    mode = mode.lower()
    
    if mode == "live":
        return LiveDataSource(symbol=symbol, **kwargs)
    
    elif mode == "replay":
        if not file_path:
            raise ValueError("file_path required for replay mode")
        return ReplayDataSource(file_path=file_path, **kwargs)
    
    else:
        raise ValueError(f"Unknown mode: {mode}. Use 'live' or 'replay'.")