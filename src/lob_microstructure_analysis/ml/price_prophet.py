from prophet import Prophet
import joblib
from pathlib import Path

from lob_microstructure_analysis.ml.price_from_L2 import load_midprice_from_l2, resample_midprice_1m

# Resolve project root
PROJECT_ROOT = Path(__file__).resolve().parents[3]
MODEL_DIR = PROJECT_ROOT / "models" / "price_prediction"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = MODEL_DIR / "prophet_midprice_15m.pkl"


def train_prophet_from_l2(parquet_relative_path: str):
    """
    Train Prophet on 1-minute mid-price derived from L2 snapshots.
    """
    # Load + resample
    df_raw = load_midprice_from_l2(parquet_relative_path)
    df = resample_midprice_1m(df_raw)

    # Prophet model (simple + stable)
    model = Prophet(
        daily_seasonality=False,
        weekly_seasonality=False,
        yearly_seasonality=False,
        changepoint_prior_scale=0.05,
        interval_width=0.8
    )

    model.fit(df)
    joblib.dump(model, MODEL_PATH)

    print(f"✅ Prophet trained on {len(df)} points")
    print(f"📦 Model saved to: {MODEL_PATH}")


class ProphetPricePredictor:
    """
    PRICE CONTEXT MODEL

    Horizon:
    - 15–30 minutes

    Purpose:
    - Trend + uncertainty estimation
    - Context for microstructure signals
    """

    def __init__(self, model_path: Path = MODEL_PATH):
        self.model = joblib.load(model_path)

    def predict(self, minutes_ahead: int = 15):
        future = self.model.make_future_dataframe(
            periods=minutes_ahead,
            freq="1min"
        )

        forecast = self.model.predict(future)

        last = forecast.iloc[-1]
        base = forecast.iloc[-minutes_ahead]

        trend = "BULLISH" if last["yhat"] > base["yhat"] else "BEARISH"

        return {
            "horizon": f"{minutes_ahead}min",
            "predicted_price": float(last["yhat"]),
            "confidence_lower": float(last["yhat_lower"]),
            "confidence_upper": float(last["yhat_upper"]),
            "trend": trend,
            "model": "Prophet"
        }


if __name__ == "__main__":
    train_prophet_from_l2(
        "data/features/live_btcusdt_20251229_120336_3.0h.parquet"
    )

    predictor = ProphetPricePredictor()
    print(predictor.predict(15))
