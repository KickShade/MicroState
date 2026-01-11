from typing import Dict, List

from lob_microstructure_analysis.core.events import BookEvent, EventType


class EventInferenceEngine:
    def infer(
        self,
        prev_book: Dict[str, Dict[float, float]],
        curr_book: Dict[str, Dict[float, float]],
        timestamp: int,
    ) -> List[BookEvent]:
        events: List[BookEvent] = []

        for side in ("bid", "ask"):
            prev_levels = prev_book.get(side, {})
            curr_levels = curr_book.get(side, {})

            # Adds & modifies
            for price, new_qty in curr_levels.items():
                prev_qty = prev_levels.get(price, 0.0)

                if price not in prev_levels:
                    events.append(
                        BookEvent(
                            timestamp, side, price, 0.0, new_qty, EventType.ADD
                        )
                    )
                elif new_qty != prev_qty:
                    events.append(
                        BookEvent(
                            timestamp, side, price, prev_qty, new_qty, EventType.MODIFY
                        )
                    )

            # Cancels
            for price, prev_qty in prev_levels.items():
                if price not in curr_levels:
                    events.append(
                        BookEvent(
                            timestamp, side, price, prev_qty, 0.0, EventType.CANCEL
                        )
                    )

        return events
