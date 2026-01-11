# src/lob_microstructure_analysis/api/models.py
"""
Pydantic models for API request/response schemas.
"""

from pydantic import BaseModel, Field
from typing import Optional


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(..., description="Service status")
    uptime_seconds: int = Field(..., description="Uptime in seconds")
    model_loaded: bool = Field(..., description="Whether ML model is loaded")
    pipeline_running: bool = Field(..., description="Whether data pipeline is running")


class PriceLevel(BaseModel):
    """Single order book price level."""
    price: float = Field(..., description="Price level")
    quantity: float = Field(..., description="Total quantity at this price")


class OrderBookSnapshot(BaseModel):
    """Current order book state."""
    timestamp: int = Field(..., description="Unix timestamp (ms)")
    bids: list[PriceLevel] = Field(default_factory=list, description="Bid levels (best first)")
    asks: list[PriceLevel] = Field(default_factory=list, description="Ask levels (best first)")
    mid_price: Optional[float] = Field(None, description="Mid price")
    spread: Optional[float] = Field(None, description="Bid-ask spread")


class FeatureSnapshot(BaseModel):
    """Computed microstructure features."""
    timestamp: int = Field(..., description="Unix timestamp (ms)")
    best_bid: Optional[float] = None
    best_ask: Optional[float] = None
    spread: Optional[float] = None
    mid_price: Optional[float] = None
    bid_volume_top_n: Optional[float] = Field(None, description="Total bid volume (top N levels)")
    ask_volume_top_n: Optional[float] = Field(None, description="Total ask volume (top N levels)")
    orderbook_imbalance: Optional[float] = Field(None, description="Order book imbalance ratio")
    rolling_volatility: Optional[float] = Field(None, description="Rolling volatility")
    rolling_mid_return: Optional[float] = Field(None, description="Rolling mid-price return")
    rolling_imbalance_mean: Optional[float] = Field(None, description="Rolling imbalance mean")


class PredictionResponse(BaseModel):
    """ML prediction result."""
    timestamp: int = Field(..., description="Unix timestamp (ms)")
    prediction: int = Field(..., description="Predicted direction: -1 (down), 0 (flat), 1 (up)")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score (0-1)")
    probabilities: dict[str, float] = Field(..., description="Class probabilities")
    horizon_ms: int = Field(..., description="Prediction horizon in milliseconds")
    
    @property
    def prediction_label(self) -> str:
        """Human-readable prediction label."""
        return {-1: "DOWN", 0: "FLAT", 1: "UP"}.get(self.prediction, "UNKNOWN")

class SystemMetrics(BaseModel):
    """System performance metrics."""
    timestamp: int = Field(..., description="Unix timestamp (ms)")
    updates_processed: int = Field(..., description="Total L2 updates processed")
    snapshots_emitted: int = Field(..., description="Total snapshots emitted")
    predictions_made: int = Field(..., description="Total predictions made")
    uptime_seconds: int = Field(..., description="System uptime")
    updates_per_second: int = Field(..., description="Current processing rate")
    active_websocket_connections: int = Field(..., description="Active WebSocket clients")