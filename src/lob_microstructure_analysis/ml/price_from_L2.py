import pandas as pd
from pathlib import Path

# Resolve project root dynamically
PROJECT_ROOT = Path(__file__).resolve().parents[3]

def load_midprice_from_l2(parquet_relative_path: str) -> pd.DataFrame:
    """
    Load L2 snapshot data and return timestamped mid-price series.

    Parameters
    ----------
    parquet_relative_path : str
        Path relative to project root, e.g.
        'data/features/live_btcusdt_20251229_120336_3.0h.parquet'

    Returns
    -------
    pd.DataFrame
        Columns: ['ds', 'mid_price']
    """
    parquet_path = PROJECT_ROOT / parquet_relative_path

    df = pd.read_parquet(parquet_path)
    df["ds"] = pd.to_datetime(df["timestamp"], unit="ms")

    return df[["ds", "mid_price"]].sort_values("ds")


def resample_midprice_1m(df: pd.DataFrame) -> pd.DataFrame:
    """
    Resample tick-level mid-price to 1-minute close price.

    Returns
    -------
    pd.DataFrame
        Columns: ['ds', 'y'] suitable for Prophet
    """
    df = df.set_index("ds")

    df_1m = (
        df["mid_price"]
        .resample("1min")
        .last()          # close-price proxy
        .dropna()
        .reset_index()
        .rename(columns={"mid_price": "y"})
    )

    return df_1m


# ---------------------------------------------------------------------
# Local sanity test (safe to remove later)
# ---------------------------------------------------------------------
if __name__ == "__main__":
    df_raw = load_midprice_from_l2(
        "data/features/live_btcusdt_20251229_120336_3.0h.parquet"
    )

    df_1m = resample_midprice_1m(df_raw)

    print(df_1m.head())
    print(df_1m.tail())
    print(f"Total 1-minute points: {len(df_1m)}")
