# src/lob_microstructure_analysis/ml/labeling.py

from collections import deque


class LabelGenerator:
    """
    Online-safe label generator.

    Labels snapshot at time t using price at time t + horizon_ms.
    """

    def __init__(self, horizon_ms: int, flat_threshold_bps: float = 1.0):
        self.horizon_ms = horizon_ms
        self.flat_threshold = flat_threshold_bps / 10_000
        self.buffer = deque()  # (timestamp_ms, price)

    def add_observation(self, timestamp_ms: int, price: float):
        """Store observation for future labeling."""
        self.buffer.append((timestamp_ms, price))

    def pop_ready_labels(self, current_timestamp_ms: int, current_price: float):
        """
        Emit labels for observations whose horizon has passed.

        Returns:
            List[(timestamp_ms, label)]
        """
        labels = []

        while self.buffer:
            ts, price_then = self.buffer[0]

            if current_timestamp_ms - ts < self.horizon_ms:
                break

            self.buffer.popleft()
            ret = (current_price - price_then) / price_then

            if abs(ret) < self.flat_threshold:
                label = 0
            elif ret > 0:
                label = 1
            else:
                label = -1

            labels.append((ts, label))

        return labels
