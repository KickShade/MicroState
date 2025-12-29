# src/lob_microstructure_analysis/api/main.py
"""
FastAPI backend for LOB microstructure system.

Provides:
- REST endpoints for current state
- WebSocket streaming for real-time updates
- Integration with live data pipeline
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from datetime import datetime

from lob_microstructure_analysis.ingestion.data_source import create_data_source
from lob_microstructure_analysis.core.processor import OrderBookProcessor
from lob_microstructure_analysis.ml.predictor import load_latest_model
from lob_microstructure_analysis.api.websocket import WebSocketManager
from lob_microstructure_analysis.api.models import (
    HealthResponse,
    OrderBookSnapshot,
    FeatureSnapshot,
    PredictionResponse,
    SystemMetrics,
    PriceLevel
)
from lob_microstructure_analysis.core.orderbook import OrderBook



# Global state
class AppState:
    """Global application state."""
    def __init__(self):
        self.processor = None
        self.predictor = None
        self.ws_manager = WebSocketManager()
        self.data_source = None
        self.is_running = False
        self.pipeline_task = None
        self.processor_queue: asyncio.Queue | None = None
        
        # Latest data cache
        self.latest_orderbook = None
        self.latest_features = None
        self.latest_prediction = None
        self.start_time = None
        
        # Metrics
        self.updates_processed = 0
        self.predictions_made = 0


app_state = AppState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic."""
    # Startup
    print("🚀 Starting LOB Microstructure API...")
    
    # Load ML model
    try:
        app_state.predictor = load_latest_model("models")
        print("✅ ML model loaded")
    except Exception as e:
        print(f"⚠️  Could not load model: {e}")
        app_state.predictor = None
    
    # Initialize empty order book
    orderbook = OrderBook()

    # Initialize processor with required orderbook
    app_state.processor = OrderBookProcessor(
        orderbook=orderbook,
        mode="live",
        snapshot_interval_ms=1000,
        label_horizon_ms=1000,  # optional, but explicit
    )

    
    # Start data pipeline
    app_state.start_time = datetime.now()
    app_state.is_running = True
    app_state.processor_queue = asyncio.Queue()

    # Start processor loop
    asyncio.create_task(
        app_state.processor.run(app_state.processor_queue)
    )

    # Start ingestion loop
    app_state.pipeline_task = asyncio.create_task(run_pipeline())

    print("✅ API ready")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down...")
    app_state.is_running = False
    
    if app_state.pipeline_task:
        app_state.pipeline_task.cancel()
        try:
            await app_state.pipeline_task
        except asyncio.CancelledError:
            pass
    
    if app_state.data_source:
        await app_state.data_source.close()
    
    print("✅ Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="LOB Microstructure API",
    description="Real-time order book analysis and ML prediction API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def run_pipeline():
    """Background task that runs the data pipeline."""
    app_state.data_source = create_data_source(
        mode="live",
        symbol="btcusdt",
        update_speed="100ms"
    )

    print("📡 Live data pipeline started")

    try:
        async for update in app_state.data_source.stream_updates():
            if not app_state.is_running:
                break

            # Each update is a single L2 level update
            await app_state.processor_queue.put(update)


            app_state.updates_processed += 1

            # Snapshot logic
            if app_state.processor.snapshots_emitted > app_state.predictions_made:
                await process_snapshot()

            # Throttle broadcasting (10 FPS)
            if app_state.updates_processed % 10 == 0:
                await broadcast_updates()

    except asyncio.CancelledError:
        print("Pipeline cancelled")
    except Exception as e:
        print(f"Pipeline error: {e}")




async def process_snapshot():
    """Process new snapshot and make prediction."""
    # Get latest order book state
    book = app_state.processor.orderbook
    
    # Cache order book snapshot
    app_state.latest_orderbook = OrderBookSnapshot(
    timestamp=int(datetime.now().timestamp() * 1000),
    bids=[
        PriceLevel(price=price, quantity=qty)
        for price, qty in list(book.bids.items())[:10]
    ],
    asks=[
        PriceLevel(price=price, quantity=qty)
        for price, qty in list(book.asks.items())[:10]
    ],
    mid_price=book.mid_price(),
    spread=book.spread(),
    )

    
    # Get latest features
    feature_computer = app_state.processor.feature_computer
    features = feature_computer.compute(book.snapshot())
    
    if features:
        app_state.latest_features = FeatureSnapshot(
            timestamp=int(datetime.now().timestamp() * 1000),
            **features
        )
        
        # Make prediction if model loaded
        if app_state.predictor:
            try:
                pred_result = app_state.predictor.predict(features)
                
                app_state.latest_prediction = PredictionResponse(
                    timestamp=int(datetime.now().timestamp() * 1000),
                    prediction=pred_result['prediction'],
                    confidence=pred_result['confidence'],
                    probabilities=pred_result['probabilities'],
                    horizon_ms=1000
                )
                
                app_state.predictions_made += 1
            
            except Exception as e:
                print(f"Prediction error: {e}")


async def broadcast_updates():
    """Broadcast updates to all connected WebSocket clients."""
    if not app_state.ws_manager.active_connections:
        return
    
    # Prepare message
    message = {
        "type": "update",
        "timestamp": int(datetime.now().timestamp() * 1000),
        "orderbook": app_state.latest_orderbook.dict() if app_state.latest_orderbook else None,
        "features": app_state.latest_features.dict() if app_state.latest_features else None,
        "prediction": app_state.latest_prediction.dict() if app_state.latest_prediction else None,
    }
    
    await app_state.ws_manager.broadcast(message)


# ============================================================
# REST ENDPOINTS
# ============================================================

@app.get("/", response_model=dict)
async def root():
    """Root endpoint."""
    return {
        "name": "LOB Microstructure API",
        "version": "1.0.0",
        "status": "running" if app_state.is_running else "stopped"
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    uptime = (datetime.now() - app_state.start_time).total_seconds() if app_state.start_time else 0
    
    return HealthResponse(
        status="healthy" if app_state.is_running else "unhealthy",
        uptime_seconds=int(uptime),
        model_loaded=app_state.predictor is not None,
        pipeline_running=app_state.is_running
    )


@app.get("/orderbook", response_model=OrderBookSnapshot)
async def get_orderbook():
    """Get current order book snapshot."""
    if app_state.latest_orderbook is None:
        return OrderBookSnapshot(
            timestamp=int(datetime.now().timestamp() * 1000),
            bids=[],
            asks=[],
            mid_price=None,
            spread=None
        )
    
    return app_state.latest_orderbook


@app.get("/features", response_model=FeatureSnapshot)
async def get_features():
    """Get latest computed features."""
    if app_state.latest_features is None:
        raise HTTPException(status_code=404, detail="No features available yet")
    
    return app_state.latest_features


@app.get("/prediction", response_model=PredictionResponse)
async def get_prediction():
    """Get latest ML prediction."""
    if app_state.latest_prediction is None:
        raise HTTPException(status_code=404, detail="No prediction available yet")
    
    return app_state.latest_prediction


@app.get("/metrics", response_model=SystemMetrics)
async def get_metrics():
    """Get system performance metrics."""
    uptime = (datetime.now() - app_state.start_time).total_seconds() if app_state.start_time else 0
    
    return SystemMetrics(
        timestamp=int(datetime.now().timestamp() * 1000),
        updates_processed=app_state.updates_processed,
        snapshots_emitted=app_state.processor.snapshots_emitted if app_state.processor else 0,
        predictions_made=app_state.predictions_made,
        uptime_seconds=int(uptime),
        updates_per_second=int(app_state.updates_processed / uptime) if uptime > 0 else 0,
        active_websocket_connections=len(app_state.ws_manager.active_connections)
    )


# ============================================================
# WEBSOCKET ENDPOINT
# ============================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time streaming.
    
    Sends updates in format:
    {
        "type": "update",
        "timestamp": 1234567890,
        "orderbook": {...},
        "features": {...},
        "prediction": {...}
    }
    """
    await app_state.ws_manager.connect(websocket)
    
    try:
        # Send initial state
        await websocket.send_json({
            "type": "connected",
            "timestamp": int(datetime.now().timestamp() * 1000),
            "message": "Connected to LOB Microstructure stream"
        })
        
        # Keep connection alive
        while True:
            # Wait for client messages (if any)
            data = await websocket.receive_text()
            # Echo back or handle commands
            await websocket.send_json({
                "type": "echo",
                "data": data
            })
    
    except WebSocketDisconnect:
        app_state.ws_manager.disconnect(websocket)
        print("Client disconnected")


# Run with: uvicorn lob_microstructure_analysis.api.main:app --reload