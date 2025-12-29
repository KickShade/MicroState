from pathlib import Path
import polars as pl

# Resolve project root (lob-microstructure-analysis/)
ROOT = Path(__file__).resolve().parents[3]

df = pl.read_parquet(
    ROOT / "data/features/live_btcusdt_20251229_120336_3.0h.parquet"
)

print(df.shape)
print(df["label"].value_counts())
print(df.head())
