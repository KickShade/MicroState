# main.py
"""
Main entry point for LOB microstructure pipeline.

Modes:
- replay: Replay historical CSV data
- live:   Stream live Binance L2 deltas

Usage:
    python main.py replay data/file.csv
    python main.py live btcusdt
"""

import asyncio
import sys
import signal
from pathlib import Path
from datetime import datetime
import structlog

from lob_microstructure_analysis.core.orderbook import OrderBook
from lob_microstructure_analysis.core.processor import OrderBookProcessor
from lob_microstructure_analysis.ingestion.loader import LOBDataLoader
from lob_microstructure_analysis.ingestion.binance_client import BinanceWebSocketClient
from lob_microstructure_analysis.ingestion.types import L2Update

# ---------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer(),
    ]
)
log = structlog.get_logger()

# ---------------------------------------------------------------------
# Producer tasks
# ---------------------------------------------------------------------
async def replay_producer(
    queue: asyncio.Queue,
    file_path: str,
    replay_speed: float = 0.0,
):
    """Replay CSV data into queue."""
    loader = LOBDataLoader(file_path, replay_speed=replay_speed)

    async for update in loader.stream():
        await queue.put(update)

    await queue.put(None)


async def live_producer(
    queue: asyncio.Queue,
    symbol: str,
):
    """Stream live Binance L2 deltas into queue."""
    client = BinanceWebSocketClient(symbol=symbol)

    try:
        async for batch in client.stream_updates():
            for update in batch:           # ✅ flatten batches
                await queue.put(update)
    finally:
        await client.close()
        await queue.put(None)


# ---------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------
async def main() -> None:
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python main.py replay <csv_path>")
        print("  python main.py live [symbol]")
        sys.exit(1)

    mode = sys.argv[1].lower()

    queue: asyncio.Queue[L2Update | None] = asyncio.Queue(maxsize=100_000)

    orderbook = OrderBook(max_depth=50)
    processor = OrderBookProcessor(
        orderbook=orderbook,
        mode="replay" if mode == "replay" else "live",
        snapshot_interval_ms=1000,
        label_horizon_ms=1000,
    )

    # -----------------------------
    # Start producer
    # -----------------------------
    if mode == "replay":
        if len(sys.argv) < 3:
            print("Replay mode requires CSV path")
            sys.exit(1)

        file_path = sys.argv[2]
        log.info("starting_replay_mode", file=file_path)

        producer_task = asyncio.create_task(
            replay_producer(queue, file_path)
        )

    elif mode == "live":
        symbol = sys.argv[2] if len(sys.argv) > 2 else "btcusdt"
        log.info("starting_live_mode", symbol=symbol)

        producer_task = asyncio.create_task(
            live_producer(queue, symbol)
        )

    else:
        raise ValueError("Mode must be 'replay' or 'live'")

    consumer_task = asyncio.create_task(processor.run(queue))

    # -----------------------------
    # Graceful shutdown
    # -----------------------------
    stop_event = asyncio.Event()

    def shutdown_handler(sig, frame):
        log.info("shutdown_signal_received", signal=sig)
        stop_event.set()

    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    stop_task = asyncio.create_task(stop_event.wait())

    done, _ = await asyncio.wait(
        [producer_task, stop_task],
        return_when=asyncio.FIRST_COMPLETED,
    )

    if stop_task in done and not producer_task.done():
        producer_task.cancel()

    # Drain queue & shutdown
    await queue.join()
    await consumer_task
    await processor.finalize()

    # -----------------------------
    # Save output
    # -----------------------------
    output_dir = Path("data/features")
    output_dir.mkdir(parents=True, exist_ok=True)

    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    output_path = output_dir / f"{mode}_{ts}.parquet"
    processor.feature_store.save(output_path)

    stats = processor.feature_store.get_stats()

    log.info(
        "pipeline_complete",
        mode=mode,
        updates=processor.updates_processed,
        snapshots=processor.snapshots_emitted,
        labeled=stats.get("labeled_records", 0),
        output=str(output_path),
    )

    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)
    print(f"Mode:              {mode}")
    print(f"Total updates:     {processor.updates_processed:,}")
    print(f"Snapshots emitted: {processor.snapshots_emitted:,}")
    print(f"Labeled records:   {stats.get('labeled_records', 0):,}")
    print(f"Output file:       {output_path}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
