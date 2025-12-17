from lob_microstructure_analysis.core.orderbook import OrderBook
from lob_microstructure_analysis.ingestion.types import L2Update
from lob_microstructure_analysis.core.event_inference import EventInferenceEngine
from lob_microstructure_analysis.core.features import FeatureComputer


class OrderBookProcessor:
    def __init__(self, orderbook: OrderBook, replay_mode: str="dataset") -> None:
        self.orderbook = orderbook
        self.current_update_id = None
        self.replay_mode = replay_mode #'dataset'/'live'

        # Phase 3
        self.prev_snapshot = None
        self.event_engine = EventInferenceEngine()

        # Phase 4
        self.feature_computer = FeatureComputer(depth=10)

    async def run(self, queue) -> None:
        snapshot_rows: list[L2Update] = []

        while True:
            update = await queue.get()

            if update is None:
                if snapshot_rows:
                    self._apply_snapshot(snapshot_rows)
                queue.task_done()
                break

            if self.current_update_id is None:
                self.current_update_id = update.update_id

            if update.update_id != self.current_update_id:
                self._apply_snapshot(snapshot_rows)
                snapshot_rows = []
                self.current_update_id = update.update_id

            snapshot_rows.append(update)
            queue.task_done()

    def _apply_snapshot(self, rows: list[L2Update]) -> None:
        # rebuild book
        if self.replay_mode == "dataset":
            self.orderbook.reset()

        for u in rows:
            if u.quantity > 0:
                self.orderbook.update_level(
                    side=u.side,
                    price=u.price,
                    quantity=u.quantity,
                )

        # snapshot print
        print(
            f"[SNAPSHOT] Bid: {self.orderbook.best_bid()} | "
            f"Ask: {self.orderbook.best_ask()}"
        )

        current_snapshot = self.orderbook.snapshot()

        # Phase 3: events
        if self.prev_snapshot is not None:
            events = self.event_engine.infer(
                self.prev_snapshot,
                current_snapshot,
                rows[0].timestamp,
            )
            # optional debug
            # print(f"[DEBUG] inferred {len(events)} events")

        self.prev_snapshot = current_snapshot

        # Phase 4: features
        features = self.feature_computer.compute(current_snapshot)
        if features:
            print("[FEATURES]", features)
