import asyncio
import polars as pl
from typing import AsyncIterator

from lob_microstructure_analysis.ingestion.types import L2Update


class LOBDataLoader:
    def __init__(self, path: str, replay_speed: float = 1.0) -> None:
        self.path = path
        self.replay_speed = replay_speed
        self.df = self._load()

    def _load(self) -> pl.DataFrame:
        df = pl.read_csv(self.path)
        return df.sort("timestamp")

    async def stream(self) -> AsyncIterator[L2Update]:
        prev_ts = None

        for row in self.df.iter_rows(named=True):
            ts = int(row["timestamp"]) * 1_000_000  # ms → ns

            if prev_ts is not None and self.replay_speed > 0:
                delta_ns = ts - prev_ts
                sleep_s = (delta_ns / 1e9) / self.replay_speed
                if sleep_s > 0:
                    await asyncio.sleep(sleep_s)

            prev_ts = ts

            yield L2Update(
                timestamp=ts,
                side=row["side"],
                price=row["price"],
                quantity=row["quantity"],
                level=row["level"],
                update_id=row["update_id"],
            )
