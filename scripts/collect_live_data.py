# scripts/collect_live_data.py
"""
Automated data collection script for live Binance WebSocket stream.

Usage:
    python scripts/collect_live_data.py           # Collect for 4 hours (default)
    python scripts/collect_live_data.py 8         # Collect for 8 hours
    python scripts/collect_live_data.py 0.25      # Collect for 15 minutes
"""

import asyncio
import sys
from datetime import datetime, timedelta
from pathlib import Path
import structlog

from lob_microstructure_analysis.core.orderbook import OrderBook
from lob_microstructure_analysis.core.processor import OrderBookProcessor
from lob_microstructure_analysis.ingestion.data_source import create_data_source
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
# Producer
# ---------------------------------------------------------------------
async def live_producer(
    queue: asyncio.Queue,
    data_source,
    end_time: datetime,
):
    """Stream live updates into queue until end_time."""
    try:
        async for update in data_source.stream_updates():
            await queue.put(update)

            if datetime.now() >= end_time:
                break
    finally:
        await queue.put(None)

# ---------------------------------------------------------------------
# Collection
# ---------------------------------------------------------------------
async def collect_data(
    symbol: str = "btcusdt",
    duration_hours: float = 4.0,
    snapshot_interval_ms: int = 1000,
):
    start_time = datetime.now()
    end_time = start_time + timedelta(hours=duration_hours)

    expected_snapshots = int(duration_hours * 3600 * (1000 / snapshot_interval_ms))

    log.info(
        "starting_data_collection",
        symbol=symbol,
        duration_hours=duration_hours,
        start_time=start_time.isoformat(),
        end_time=end_time.isoformat(),
        expected_snapshots=expected_snapshots,
    )

    print("\n" + "=" * 60)
    print("LIVE DATA COLLECTION")
    print("=" * 60)
    print(f"Symbol:             {symbol.upper()}")
    print(f"Duration:           {duration_hours} hours")
    print(f"Start time:         {start_time:%Y-%m-%d %H:%M:%S}")
    print(f"Expected end:       {end_time:%Y-%m-%d %H:%M:%S}")
    print(f"Expected snapshots: ~{expected_snapshots:,}")
    print("=" * 60 + "\n")

    # --- Create components ---
    queue: asyncio.Queue[L2Update | None] = asyncio.Queue(maxsize=100_000)

    data_source = create_data_source(
        mode="live",
        symbol=symbol,
        update_speed="100ms",
    )

    orderbook = OrderBook(max_depth=50)
    processor = OrderBookProcessor(
        orderbook=orderbook,
        mode="live",
        snapshot_interval_ms=snapshot_interval_ms,
        label_horizon_ms=1000,
    )

    producer_task = asyncio.create_task(
        live_producer(queue, data_source, end_time)
    )
    consumer_task = asyncio.create_task(
        processor.run(queue)
    )

    # --- Wait for completion ---
    await producer_task

    try:
        await asyncio.wait_for(queue.join(), timeout=10)
    except asyncio.TimeoutError:
        log.warning("queue_join_timeout")

    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass

    # --- Finalize ---
    await processor.finalize()
    await data_source.close()

    # --- Save dataset ---
    output_dir = Path("data/features")
    output_dir.mkdir(parents=True, exist_ok=True)

    ts = start_time.strftime("%Y%m%d_%H%M%S")
    output_path = output_dir / f"live_{symbol}_{ts}_{duration_hours}h.parquet"
    processor.feature_store.save(output_path)

    stats = processor.feature_store.get_stats()
    elapsed = (datetime.now() - start_time).total_seconds()

    print("\n" + "=" * 60)
    print("COLLECTION COMPLETE")
    print("=" * 60)
    print(f"Total updates:     {processor.updates_processed:,}")
    print(f"Total snapshots:   {processor.snapshots_emitted:,}")
    print(f"Labeled records:   {stats.get('labeled_records', 0):,}")
    print(f"Elapsed time:      {elapsed / 3600:.2f} hours")
    print(f"Output file:       {output_path}")
    print(f"File size:         {output_path.stat().st_size / (1024*1024):.2f} MB")
    print("=" * 60 + "\n")

    log.info(
        "collection_complete",
        updates=processor.updates_processed,
        snapshots=processor.snapshots_emitted,
        labeled=stats.get("labeled_records", 0),
        output=str(output_path),
    )

# ---------------------------------------------------------------------
# Entry
# ---------------------------------------------------------------------
async def main():
    duration_hours = 4.0
    if len(sys.argv) > 1:
        duration_hours = float(sys.argv[1])

    symbol = sys.argv[2].lower() if len(sys.argv) > 2 else "btcusdt"

    await collect_data(
        symbol=symbol,
        duration_hours=duration_hours,
        snapshot_interval_ms=1000,
    )

if __name__ == "__main__":
    asyncio.run(main())
