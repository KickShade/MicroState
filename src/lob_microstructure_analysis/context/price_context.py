import pandas as pd
import joblib
from pathlib import Path
from collections import deque
import time


class PriceContextEngine:
    """
    Rolling price context using Prophet.
    Updates every 1 minute.
    Forecasts 15–30 min horizon.
    """

    def __init__(
        self,
        model_path: Path,
        max_history_minutes: int = 180
    ):
        self.model = joblib.load(model_path)

        self.history = deque(maxlen=max_history_minutes)
        self.last_update_minute = None
        self.last_forecast = None

    def maybe_update(self, midprice: float, timestamp_ms: int):
        """
        Update context ONCE per minute.
        """
        minute = timestamp_ms // 60000

        if minute == self.last_update_minute:
            return  # skip

        self.last_update_minute = minute

        self.history.append({
            "ds": pd.to_datetime(timestamp_ms, unit="ms"),
            "y": midprice
        })

    def forecast(self, minutes_ahead: int = 15):
        """
        Generate forecast from Prophet model.
        """
        future = self.model.make_future_dataframe(
            periods=minutes_ahead,
            freq="1min"
        )

        forecast = self.model.predict(future)

        last = forecast.iloc[-1]
        base = forecast.iloc[-minutes_ahead]

        expected_return_pct = (
            (last["yhat"] - base["yhat"]) / base["yhat"]
        ) * 100

        trend = "BULLISH" if expected_return_pct > 0 else "BEARISH"

        self.last_forecast = {
            "horizon_min": minutes_ahead,
            "trend": trend,
            "expected_return_pct": float(expected_return_pct),
            "price_target": float(last["yhat"]),
            "confidence_lower": float(last["yhat_lower"]),
            "confidence_upper": float(last["yhat_upper"]),
            "timestamp": int(time.time() * 1000)
        }

        return self.last_forecast
