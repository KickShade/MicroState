# # src/lob_microstructure_analysis/api/main.py
# """
# FastAPI backend for LOB microstructure system.

# Provides:
# - REST endpoints for current state
# - WebSocket streaming for real-time updates
# - Live microstructure ML predictions
# - Rolling mid-term price context (Prophet)
# """

# from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from contextlib import asynccontextmanager
# import asyncio
# from datetime import datetime
# from pathlib import Path

# from lob_microstructure_analysis.ingestion.data_source import create_data_source
# from lob_microstructure_analysis.core.processor import OrderBookProcessor
# from lob_microstructure_analysis.ml.model_loader import load_latest_model
# from lob_microstructure_analysis.api.websocket import WebSocketManager
# from lob_microstructure_analysis.api.models import (
#     HealthResponse,
#     OrderBookSnapshot,
#     FeatureSnapshot,
#     PredictionResponse,
#     SystemMetrics,
#     PriceLevel,
# )
# from lob_microstructure_analysis.core.orderbook import OrderBook


# # ============================================================
# # Global Application State
# # ============================================================

# class AppState:
#     def __init__(self):
#         self.processor: OrderBookProcessor | None = None
#         self.predictor = None
#         self.ws_manager = WebSocketManager()
#         self.data_source = None
#         self.pipeline_task: asyncio.Task | None = None
#         self.processor_queue: asyncio.Queue | None = None
#         self.is_running = False

#         # Cached outputs
#         self.latest_orderbook = None
#         self.latest_features = None
#         self.latest_prediction = None

#         # Metrics
#         self.start_time = None
#         self.updates_processed = 0
#         self.predictions_made = 0


# app_state = AppState()


# # ============================================================
# # Lifespan (startup / shutdown)
# # ============================================================

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     print("🚀 Starting LOB Microstructure API...")

#     # Load microstructure ML model
#     try:
#         app_state.predictor = load_latest_model()
#         print("✅ Microstructure ML model loaded")
#     except Exception as e:
#         print(f"⚠️ Could not load ML model: {e}")
#         app_state.predictor = None

#     # Initialize order book + processor
#     orderbook = OrderBook()

#     app_state.processor = OrderBookProcessor(
#         orderbook=orderbook,
#         mode="live",
#         snapshot_interval_ms=1000,
#         label_horizon_ms=1000,
#     )

#     # Init runtime
#     app_state.processor_queue = asyncio.Queue()
#     app_state.start_time = datetime.now()
#     app_state.is_running = True

#     # Start processor loop
#     asyncio.create_task(app_state.processor.run(app_state.processor_queue))

#     # Start ingestion pipeline
#     app_state.pipeline_task = asyncio.create_task(run_pipeline())

#     print("✅ API ready")
#     yield

#     # Shutdown
#     print("🛑 Shutting down...")
#     app_state.is_running = False

#     if app_state.pipeline_task:
#         app_state.pipeline_task.cancel()
#         try:
#             await app_state.pipeline_task
#         except asyncio.CancelledError:
#             pass

#     if app_state.data_source:
#         await app_state.data_source.close()

#     print("✅ Shutdown complete")


# # ============================================================
# # FastAPI App
# # ============================================================

# app = FastAPI(
#     title="LOB Microstructure API",
#     description="Real-time order book analysis and ML prediction system",
#     version="1.0.0",
#     lifespan=lifespan,
# )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # ============================================================
# # Data Pipeline
# # ============================================================

# async def run_pipeline():
#     app_state.data_source = create_data_source(
#         mode="live",
#         symbol="btcusdt",
#         update_speed="100ms",
#     )

#     print("📡 Live data pipeline started")

#     try:
#         async for update in app_state.data_source.stream_updates():
#             if not app_state.is_running:
#                 break

#             await app_state.processor_queue.put(update)
#             app_state.updates_processed += 1

#             # Detect new snapshot
#             if app_state.processor.snapshots_emitted > app_state.predictions_made:
#                 await process_snapshot()

#             # Throttle WS broadcast (~10 FPS)
#             if app_state.updates_processed % 10 == 0:
#                 await broadcast_updates()

#     except asyncio.CancelledError:
#         pass
#     except Exception as e:
#         print(f"Pipeline error: {e}")


# async def process_snapshot():
#     book = app_state.processor.orderbook

#     # Cache order book snapshot
#     app_state.latest_orderbook = OrderBookSnapshot(
#         timestamp=int(datetime.now().timestamp() * 1000),
#         bids=[
#             PriceLevel(price=p, quantity=q)
#             for p, q in list(book.bids.items())[:10]
#         ],
#         asks=[
#             PriceLevel(price=p, quantity=q)
#             for p, q in list(book.asks.items())[:10]
#         ],
#         mid_price=book.mid_price(),
#         spread=book.spread(),
#     )

#     # Compute features
#     features = app_state.processor.feature_computer.compute(book.snapshot())
#     if not features:
#         return

#     app_state.latest_features = FeatureSnapshot(
#         timestamp=int(datetime.now().timestamp() * 1000),
#         **features,
#     )

#     # Microstructure ML prediction
#     if app_state.predictor:
#         try:
#             pred = app_state.predictor.predict(features)
#             app_state.latest_prediction = PredictionResponse(
#                 timestamp=int(datetime.now().timestamp() * 1000),
#                 prediction=pred["prediction"],
#                 confidence=pred["confidence"],
#                 probabilities=pred["probabilities"],
#                 horizon_ms=1000,
#             )
#             app_state.predictions_made += 1
#         except Exception as e:
#             print(f"Prediction error: {e}")


# async def broadcast_updates():
#     if not app_state.ws_manager.active_connections:
#         return

#     await app_state.ws_manager.broadcast(
#         {
#             "type": "update",
#             "timestamp": int(datetime.now().timestamp() * 1000),
#             "orderbook": app_state.latest_orderbook.dict()
#             if app_state.latest_orderbook else None,
#             "features": app_state.latest_features.dict()
#             if app_state.latest_features else None,
#             "prediction": app_state.latest_prediction.dict()
#             if app_state.latest_prediction else None,
#         }
#     )


# # ============================================================
# # REST Endpoints
# # ============================================================

# @app.get("/")
# async def root():
#     return {
#         "name": "LOB Microstructure API",
#         "status": "running" if app_state.is_running else "stopped",
#     }


# @app.get("/prediction", response_model=PredictionResponse)
# async def get_prediction():
#     if app_state.latest_prediction is None:
#         raise HTTPException(status_code=404, detail="No prediction available")
#     return app_state.latest_prediction


# @app.get("/context/price")
# async def get_price_context(horizon_min: int = 15):
#     """
#     Rolling mid-term price context (Prophet).
#     Research / dashboard endpoint.
#     """
#     if app_state.processor is None:
#         raise HTTPException(status_code=503, detail="Processor not ready")

#     ctx = app_state.processor.price_context.forecast(horizon_min)
#     if ctx is None:
#         return {"status": "warming_up"}

#     return ctx


# @app.get("/orderbook", response_model=OrderBookSnapshot)
# async def get_orderbook():
#     if app_state.latest_orderbook is None:
#         return OrderBookSnapshot(
#             timestamp=int(datetime.now().timestamp() * 1000),
#             bids=[],
#             asks=[],
#             mid_price=None,
#             spread=None,
#         )
#     return app_state.latest_orderbook


# @app.get("/features", response_model=FeatureSnapshot)
# async def get_features():
#     if app_state.latest_features is None:
#         raise HTTPException(status_code=404, detail="No features available")
#     return app_state.latest_features


# @app.get("/metrics", response_model=SystemMetrics)
# async def get_metrics():
#     uptime = (
#         datetime.now() - app_state.start_time
#     ).total_seconds() if app_state.start_time else 0

#     return SystemMetrics(
#         timestamp=int(datetime.now().timestamp() * 1000),
#         updates_processed=app_state.updates_processed,
#         snapshots_emitted=(
#             app_state.processor.snapshots_emitted
#             if app_state.processor else 0
#         ),
#         predictions_made=app_state.predictions_made,
#         uptime_seconds=int(uptime),
#         updates_per_second=int(app_state.updates_processed / uptime)
#         if uptime > 0 else 0,
#         active_websocket_connections=len(
#             app_state.ws_manager.active_connections
#         ),
#     )


# @app.get("/health", response_model=HealthResponse)
# async def health():
#     uptime = (
#         datetime.now() - app_state.start_time
#     ).total_seconds() if app_state.start_time else 0

#     return HealthResponse(
#         status="healthy" if app_state.is_running else "unhealthy",
#         uptime_seconds=int(uptime),
#         model_loaded=app_state.predictor is not None,
#         pipeline_running=app_state.is_running,
#     )


# # ============================================================
# # WebSocket
# # ============================================================

# @app.websocket("/ws")
# async def websocket_endpoint(websocket: WebSocket):
#     await app_state.ws_manager.connect(websocket)
#     try:
#         await websocket.send_json(
#             {
#                 "type": "connected",
#                 "timestamp": int(datetime.now().timestamp() * 1000),
#             }
#         )
#         while True:
#             await websocket.receive_text()
#     except WebSocketDisconnect:
#         app_state.ws_manager.disconnect(websocket)

'''New'''
# src/lob_microstructure_analysis/api/main.py
"""
FastAPI backend for LOB microstructure system.

Provides:
- REST endpoints for current state
- WebSocket streaming for real-time updates
- Live microstructure ML predictions
- Rolling mid-term price context (Prophet)
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from datetime import datetime
from pathlib import Path

from lob_microstructure_analysis.ingestion.data_source import create_data_source
from lob_microstructure_analysis.core.processor import OrderBookProcessor
from lob_microstructure_analysis.ml.model_loader import load_latest_model
from lob_microstructure_analysis.api.websocket import WebSocketManager
from lob_microstructure_analysis.api.models import (
    HealthResponse,
    OrderBookSnapshot,
    FeatureSnapshot,
    PredictionResponse,
    SystemMetrics,
    PriceLevel,
)
from lob_microstructure_analysis.core.orderbook import OrderBook
from lob_microstructure_analysis.ml.signal_aggregator import aggregate_signals



# ============================================================
# Global Application State
# ============================================================

class AppState:
    def __init__(self):
        self.processor: OrderBookProcessor | None = None
        self.predictor = None
        self.ws_manager = WebSocketManager()
        self.data_source = None
        self.pipeline_task: asyncio.Task | None = None
        self.processor_queue: asyncio.Queue | None = None
        self.is_running = False

        # Cached outputs
        self.latest_orderbook = None
        self.latest_features = None
        self.latest_prediction = None

        # Metrics
        self.start_time = None
        self.updates_processed = 0
        self.predictions_made = 0


app_state = AppState()


# ============================================================
# Lifespan (startup / shutdown)
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting LOB Microstructure API...")

    # Load microstructure ML model
    try:
        app_state.predictor = load_latest_model()
        print("✅ Microstructure ML model loaded")
    except Exception as e:
        print(f"⚠️ Could not load ML model: {e}")
        app_state.predictor = None

    # Initialize order book + processor
    orderbook = OrderBook()

    app_state.processor = OrderBookProcessor(
        orderbook=orderbook,
        mode="live",
        snapshot_interval_ms=1000,
        label_horizon_ms=1000,
    )

    # Init runtime
    app_state.processor_queue = asyncio.Queue()
    app_state.start_time = datetime.now()
    app_state.is_running = True

    # Start processor loop
    asyncio.create_task(app_state.processor.run(app_state.processor_queue))

    # Start ingestion pipeline
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


# ============================================================
# FastAPI App
# ============================================================

app = FastAPI(
    title="LOB Microstructure API",
    description="Real-time order book analysis and ML prediction system",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Data Pipeline
# ============================================================

async def run_pipeline():
    app_state.data_source = create_data_source(
        mode="live",
        symbol="btcusdt",
        update_speed="100ms",
    )

    print("📡 Live data pipeline started")

    try:
        async for update in app_state.data_source.stream_updates():
            if not app_state.is_running:
                break

            await app_state.processor_queue.put(update)
            app_state.updates_processed += 1

            # Detect new snapshot
            if app_state.processor.snapshots_emitted > app_state.predictions_made:
                await process_snapshot()

            # Throttle WS broadcast (~10 FPS)
            if app_state.updates_processed % 10 == 0:
                await broadcast_updates()

    except asyncio.CancelledError:
        pass
    except Exception as e:
        print(f"Pipeline error: {e}")


async def process_snapshot():
    book = app_state.processor.orderbook

    # Cache order book snapshot
    app_state.latest_orderbook = OrderBookSnapshot(
        timestamp=int(datetime.now().timestamp() * 1000),
        bids=[
            PriceLevel(price=p, quantity=q)
            for p, q in list(book.bids.items())[:10]
        ],
        asks=[
            PriceLevel(price=p, quantity=q)
            for p, q in list(book.asks.items())[:10]
        ],
        mid_price=book.mid_price(),
        spread=book.spread(),
    )

    # Compute features
    features = app_state.processor.feature_computer.compute(book.snapshot())
    if not features:
        return

    app_state.latest_features = FeatureSnapshot(
        timestamp=int(datetime.now().timestamp() * 1000),
        **features,
    )

    # Microstructure ML prediction
    if app_state.predictor:
        try:
            pred = app_state.predictor.predict(features)
            app_state.latest_prediction = PredictionResponse(
                timestamp=int(datetime.now().timestamp() * 1000),
                prediction=pred["prediction"],
                confidence=pred["confidence"],
                probabilities=pred["probabilities"],
                horizon_ms=1000,
            )
            app_state.predictions_made += 1
        except Exception as e:
            print(f"Prediction error: {e}")


async def broadcast_updates():
    if not app_state.ws_manager.active_connections:
        return

    await app_state.ws_manager.broadcast(
        {
            "type": "update",
            "timestamp": int(datetime.now().timestamp() * 1000),
            "orderbook": app_state.latest_orderbook.dict()
            if app_state.latest_orderbook else None,
            "features": app_state.latest_features.dict()
            if app_state.latest_features else None,
            "prediction": app_state.latest_prediction.dict()
            if app_state.latest_prediction else None,
        }
    )


# ============================================================
# REST Endpoints
# ============================================================

@app.get("/")
async def root():
    return {
        "name": "LOB Microstructure API",
        "status": "running" if app_state.is_running else "stopped",
    }


@app.get("/prediction", response_model=PredictionResponse)
async def get_prediction():
    if app_state.latest_prediction is None:
        raise HTTPException(status_code=404, detail="No prediction available")
    return app_state.latest_prediction


@app.get("/context/price")
async def get_price_context(horizon_min: int = 15):
    """
    Rolling mid-term price context (Prophet).
    Research / dashboard endpoint.
    """
    if app_state.processor is None:
        raise HTTPException(status_code=503, detail="Processor not ready")

    ctx = app_state.processor.price_context.forecast(horizon_min)
    if ctx is None:
        return {"status": "warming_up"}

    return ctx


@app.get("/orderbook", response_model=OrderBookSnapshot)
async def get_orderbook():
    if app_state.latest_orderbook is None:
        return OrderBookSnapshot(
            timestamp=int(datetime.now().timestamp() * 1000),
            bids=[],
            asks=[],
            mid_price=None,
            spread=None,
        )
    return app_state.latest_orderbook


@app.get("/features", response_model=FeatureSnapshot)
async def get_features():
    if app_state.latest_features is None:
        raise HTTPException(status_code=404, detail="No features available")
    return app_state.latest_features


@app.get("/metrics", response_model=SystemMetrics)
async def get_metrics():
    uptime = (
        datetime.now() - app_state.start_time
    ).total_seconds() if app_state.start_time else 0

    return SystemMetrics(
        timestamp=int(datetime.now().timestamp() * 1000),
        updates_processed=app_state.updates_processed,
        snapshots_emitted=(
            app_state.processor.snapshots_emitted
            if app_state.processor else 0
        ),
        predictions_made=app_state.predictions_made,
        uptime_seconds=int(uptime),
        updates_per_second=int(app_state.updates_processed / uptime)
        if uptime > 0 else 0,
        active_websocket_connections=len(
            app_state.ws_manager.active_connections
        ),
    )


@app.get("/health", response_model=HealthResponse)
async def health():
    uptime = (
        datetime.now() - app_state.start_time
    ).total_seconds() if app_state.start_time else 0

    return HealthResponse(
        status="healthy" if app_state.is_running else "unhealthy",
        uptime_seconds=int(uptime),
        model_loaded=app_state.predictor is not None,
        pipeline_running=app_state.is_running,
    )

@app.get("/interpretation")
async def get_interpretation():
    """
    Combine microstructure model prediction with price trend context
    using signal aggregation engine.
    """
    if (
        app_state.latest_prediction is None
        or app_state.latest_features is None
        or app_state.processor is None
    ):
        raise HTTPException(status_code=404, detail="Not enough data yet")

    # Map micro prediction -> UP/DOWN/FLAT
    pred_value = app_state.latest_prediction.prediction
    micro_label = {-1: "DOWN", 0: "FLAT", 1: "UP"}.get(pred_value, "UNKNOWN")

    # Get price context (trend)
    ctx = app_state.processor.price_context.forecast(15)
    price_trend = ctx.get("trend", "neutral") if ctx else "neutral"

    # Aggregate using engine
    result = aggregate_signals(
        micro_signal=micro_label,
        price_trend=price_trend,
        micro_confidence=app_state.latest_prediction.confidence,
    )

    return result


# ============================================================
# WebSocket
# ============================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await app_state.ws_manager.connect(websocket)
    try:
        await websocket.send_json(
            {
                "type": "connected",
                "timestamp": int(datetime.now().timestamp() * 1000),
            }
        )
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        app_state.ws_manager.disconnect(websocket)

