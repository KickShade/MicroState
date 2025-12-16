from lob_microstructure_analysis.core.orderbook import OrderBook
from lob_microstructure_analysis.ingestion.types import L2Update


class OrderBookProcessor:
    def __init__(self, orderbook: OrderBook) -> None:
        self.orderbook = orderbook
        self.current_update_id = None

    async def run(self, queue) -> None:
        snapshot_rows = []

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
        self.orderbook.reset()

        for u in rows:
            if u.quantity > 0:
                self.orderbook.update_level(
                    side=u.side,
                    price=u.price,
                    quantity=u.quantity,
                )

        print(
            f"[SNAPSHOT] Bid: {self.orderbook.best_bid()} | "
            f"Ask: {self.orderbook.best_ask()}"
        )
