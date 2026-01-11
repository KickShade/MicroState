from collections import deque
from typing import Dict
import math
import heapq

class FeatureComputer:
    def __init__(self, depth: int = 10, window: int = 50) -> None:
        self.depth = depth
        self.window = window

        # rolling buffers
        self.mid_prices = deque(maxlen=window)
        self.imbalances = deque(maxlen=window)

        # rolling volatility (Welford)
        self._count = 0
        self._mean = 0.0
        self._m2 = 0.0

    def compute(self, snapshot: Dict[str, Dict[float, float]]) -> Dict[str, float]:
        bids = snapshot["bid"]
        asks = snapshot["ask"]

        if not bids or not asks:
            return {}

        best_bid = next(iter(bids))
        best_ask = next(iter(asks))


        mid = (best_bid + best_ask) / 2
        spread = best_ask - best_bid


        top_bids = heapq.nlargest(self.depth, bids.items(), key=lambda x: x[0])
        top_asks = heapq.nsmallest(self.depth, asks.items(), key=lambda x: x[0])

        bid_vol = sum(q for _, q in top_bids)
        ask_vol = sum(q for _, q in top_asks)

        imbalance = (
            (bid_vol - ask_vol) / (bid_vol + ask_vol)
            if (bid_vol + ask_vol) > 0
            else 0.0
        )

        # update rolling buffers
        self.mid_prices.append(mid)
        self.imbalances.append(imbalance)

        # rolling volatility (incremental)
        self._count += 1
        if self._count > self.window:
            self._count = self.window
        delta = mid - self._mean
        self._mean += delta / self._count
        delta2 = mid - self._mean
        self._m2 += delta * delta2

        volatility = (
            math.sqrt(self._m2 / (self._count - 1))
            if self._count > 1
            else 0.0
        )

        return {
            "best_bid": best_bid,
            "best_ask": best_ask,
            "spread": spread,
            "mid_price": mid,
            "bid_volume_top_n": bid_vol,
            "ask_volume_top_n": ask_vol,
            "orderbook_imbalance": imbalance,
            "rolling_volatility": volatility,
            "rolling_mid_return": (
                self.mid_prices[-1] - self.mid_prices[-2]
                if len(self.mid_prices) > 1
                else 0.0
            ),
            "rolling_imbalance_mean": sum(self.imbalances) / len(self.imbalances),
        }
