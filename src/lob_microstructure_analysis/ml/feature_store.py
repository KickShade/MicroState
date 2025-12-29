# src/lob_microstructure_analysis/ml/feature_store.py

from pathlib import Path
from typing import Dict, List, Optional

import polars as pl


class FeatureStore:
    """
    Append-only feature store for time-series ML data with delayed labeling support.

    Stores rows of:
        timestamp | feature_1 | feature_2 | ... | label

    Design:
    - Features are appended immediately
    - Labels may be filled later (online-safe)
    - Time-ordered
    - Efficient lookup by timestamp
    """

    def __init__(self) -> None:
        self._records: List[Dict] = []
        self._index_by_timestamp: Dict[int, int] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def add_record(
        self,
        timestamp: int,
        features: Dict[str, float],
        label: Optional[int],
    ) -> None:
        """
        Add a single observation to the store.

        Args:
            timestamp: snapshot time in milliseconds
            features: feature dictionary
            label: {-1, 0, +1} or None if unresolved
        """
        record = {
            "timestamp": timestamp,
            "label": label,
            **features,
        }

        self._index_by_timestamp[timestamp] = len(self._records)
        self._records.append(record)

    def set_label(self, timestamp: int, label: int) -> None:
        """
        Set label for an existing record once horizon has passed.
        """
        idx = self._index_by_timestamp.get(timestamp)
        if idx is None:
            return

        self._records[idx]["label"] = label

    def to_dataframe(self) -> pl.DataFrame:
        """
        Convert stored records to a Polars DataFrame.
        """
        if not self._records:
            return pl.DataFrame()

        return pl.DataFrame(self._records)

    def save(self, path: Path) -> None:
        """
        Save the feature store to a Parquet file.
        """
        path.parent.mkdir(parents=True, exist_ok=True)

        df = self.to_dataframe()
        df.write_parquet(path)

        print(f"[FeatureStore] Saved {len(df)} rows to {path}")

    def get_stats(self) -> Dict:
        """
        Return basic dataset statistics for sanity checks.
        """
        df = self.to_dataframe()
        if df.is_empty():
            return {"total_records": 0}

        labeled = df.filter(pl.col("label").is_not_null())

        stats = {
            "total_records": len(df),
            "labeled_records": len(labeled),
            "time_span_ms": int(df["timestamp"].max() - df["timestamp"].min()),
        }

        if len(labeled) > 0:
            label_dist = (
                labeled
                .group_by("label")
                .agg(pl.count().alias("count"))
                .sort("label")
            )

            stats["label_distribution"] = {
                "label": label_dist["label"].to_list(),
                "count": label_dist["count"].to_list(),
            }

        return stats


