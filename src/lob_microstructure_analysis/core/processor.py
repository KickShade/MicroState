# src/lob_microstructure_analysis/core/processor.py

import asyncio
from typing import Optional, List
import structlog

from lob_microstructure_analysis.core.orderbook import OrderBook
from lob_microstructure_analysis.ingestion.types import L2Update
from lob_microstructure_analysis.core.event_inference import EventInferenceEngine
from lob_microstructure_analysis.core.features import FeatureComputer
from lob_microstructure_analysis.ml.labeling import LabelGenerator
from lob_microstructure_analysis.ml.feature_store import FeatureStore
from lob_microstructure_analysis.context.price_context import PriceContextEngine
from pathlib import Path

log = structlog.get_logger()

SNAPSHOT_INTERVAL_MS = 1000  # 1 second snapshots


class OrderBookProcessor:
    """
    Central pipeline processor.

    Modes:
    - replay: snapshot-based datasets (order book RESET every snapshot)
    - live:   delta-based streams (continuous order book state)
    """

    def __init__(
        self,
        orderbook: OrderBook,
        mode: str = "live",              # 'live' | 'replay'
        snapshot_interval_ms: int = SNAPSHOT_INTERVAL_MS,
        label_horizon_ms: int = 5000,
    ) -> None:
        self.orderbook = orderbook
        self.mode = mode.lower()
        self.snapshot_interval_ms = snapshot_interval_ms

        if self.mode not in {"live", "replay"}:
            raise ValueError("mode must be 'live' or 'replay'")

        # --- Snapshot state ---
        self.current_bucket: Optional[int] = None
        self.snapshot_rows: List[L2Update] = []

        # --- Phase 3 ---
        self.prev_snapshot = None
        self.event_engine = EventInferenceEngine()

        # --- Phase 4 ---
        self.feature_computer = FeatureComputer(depth=10)

        # --- Phase 5 ---
        self.label_generator = LabelGenerator(horizon_ms=label_horizon_ms, flat_threshold_bps=0.3)
        self.feature_store = FeatureStore()

        # --- Stats ---
        self.updates_processed = 0
        self.snapshots_emitted = 0

        # --- Price context (Prophet) ---
        self.price_context = PriceContextEngine(
            model_path=Path("models/price_prediction/prophet_midprice_15m.pkl")
)


        log.info(
            "processor_initialized",
            mode=self.mode,
            snapshot_interval_ms=snapshot_interval_ms,
            label_horizon_ms=label_horizon_ms,
        )

    async def run(self, queue: asyncio.Queue) -> None:
        """
        Main consumer loop.
        Reads L2Update objects from queue and processes time-bucketed snapshots.
        """
        while True:
            update = await queue.get()

            # End-of-stream signal
            if update is None:
                if self.snapshot_rows:
                    self._apply_snapshot(self.snapshot_rows)
                queue.task_done()
                break

            self.updates_processed += 1

            # --- Normalize timestamp to milliseconds ---
            # Live WS timestamps: ms
            # Dataset timestamps: often µs
            # Binance timestamps are in milliseconds (~1e12)
            # Dataset timestamps may be in microseconds (~1e15)
            if update.timestamp > 10_000_000_000_000:
                timestamp_ms = update.timestamp // 1_000   # µs → ms
            else:
                timestamp_ms = update.timestamp             # already ms


            # --- Time bucket ---
            bucket = timestamp_ms // self.snapshot_interval_ms

            if self.current_bucket is None:
                self.current_bucket = bucket

            # --- Emit snapshot when bucket changes ---
            if bucket != self.current_bucket:
                self._apply_snapshot(self.snapshot_rows)
                self.snapshot_rows = []
                self.current_bucket = bucket

            self.snapshot_rows.append(update)
            queue.task_done()

    def _apply_snapshot(self, rows: List[L2Update]) -> None:
        """
        Apply one snapshot worth of updates.
        """
        if not rows:
            return

        # --- Replay semantics ---
        # Dataset snapshots are full reconstructions → reset book
        if self.mode == "replay":
            self.orderbook.reset()

        # --- Apply L2 updates (delta semantics) ---
        for u in rows:
            # quantity == 0 → cancel
            self.orderbook.update_level(
                side=u.side,
                price=u.price,
                quantity=u.quantity,
            )

        # --- Snapshot ---
        snapshot = self.orderbook.snapshot()

        # Snapshot timestamp = bucket boundary (ms)
        snapshot_ts_ms = self.current_bucket * self.snapshot_interval_ms

        # --- Phase 3: Event inference (optional) ---
        if self.prev_snapshot is not None:
            self.event_engine.infer(
                self.prev_snapshot,
                snapshot,
                snapshot_ts_ms,
            )
        self.prev_snapshot = snapshot

        # --- Phase 4: Feature computation ---
        features = self.feature_computer.compute(snapshot)
        if not features:
            return

        mid_price = features.get("mid_price")
        if mid_price is None:
            return
        # --- Price context update (1-min rolling) ---
        self.price_context.maybe_update(mid_price, snapshot_ts_ms)

        # --- Phase 5: Labeling ---
        self.label_generator.add_observation(snapshot_ts_ms, mid_price)
        ready_labels = self.label_generator.pop_ready_labels(
            snapshot_ts_ms, mid_price
        )

        for ts, label in ready_labels:
            self.feature_store.set_label(ts, label)

        # Add features without label initially
        self.feature_store.add_record(
            timestamp=snapshot_ts_ms,
            features=features,
            label=None,
        )


        self.snapshots_emitted += 1

        if self.snapshots_emitted % 100 == 0:
            stats = self.feature_store.get_stats()
            log.info(
                "snapshot_progress",
                snapshots=self.snapshots_emitted,
                updates=self.updates_processed,
                labeled=stats.get("labeled_records", 0),
            )

    async def finalize(self) -> None:
        """
        Flush remaining data at shutdown.
        """
        if self.snapshot_rows:
            self._apply_snapshot(self.snapshot_rows)

        log.info(
            "processor_finalized",
            updates_processed=self.updates_processed,
            snapshots_emitted=self.snapshots_emitted,
        )
