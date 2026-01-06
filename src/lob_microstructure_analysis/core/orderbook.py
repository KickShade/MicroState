from sortedcontainers import SortedDict
from typing import Dict, List, Optional, Tuple
import heapq

Price = float
Quantity = float
Side = str  # "bid" | "ask"


class OrderBook:
    """
    In-memory Level-2 order book.
    Maintains aggregated quantities per price level.
    """

    def __init__(self, max_depth: int = 50) -> None:
        self.max_depth = max_depth

        # Bids sorted descending
        self.bids: SortedDict[Price, Quantity] = SortedDict(lambda p: -p)

        # Asks sorted ascending
        self.asks: SortedDict[Price, Quantity] = SortedDict()

    def _book(self, side: Side) -> SortedDict:
        if side == "bid":
            return self.bids
        if side == "ask":
            return self.asks
        raise ValueError(f"Invalid side: {side}")

    def update_level(self, side: Side, price: Price, quantity: Quantity) -> None:
        """
        Add, update, or remove a price level.
        quantity <= 0 implies removal.
        """
        book = self._book(side)

        if quantity <= 0:
            book.pop(price, None)
        else:
            book[price] = quantity

        self._enforce_depth(book)
        self._sanitize_crossed_book()

    def _enforce_depth(self, book: SortedDict) -> None:
        while len(book) > self.max_depth:
            book.popitem(index=-1)

    def _sanitize_crossed_book(self) -> None:
        if not self.bids or not self.asks:
            return

        if self.best_bid() >= self.best_ask():
            # Data corruption safeguard: drop weakest ask
            self.asks.popitem(index=0)

    def best_bid(self) -> Optional[Price]:
        return next(iter(self.bids), None)

    def best_ask(self) -> Optional[Price]:
        return next(iter(self.asks), None)

    def mid_price(self) -> Optional[float]:
        bid = self.best_bid()
        ask = self.best_ask()
        if bid is None or ask is None:
            return None
        return (bid + ask) / 2.0

    def spread(self) -> Optional[float]:
        bid = self.best_bid()
        ask = self.best_ask()
        if bid is None or ask is None:
            return None
        return ask - bid

    def depth(self, n: int = 5) -> Dict[str, List[Tuple[Price, Quantity]]]:
        return {
            "bids": list(self.bids.items())[:n],
            "asks": list(self.asks.items())[:n],
        }

    def snapshot(self) -> Dict[str, Dict[Price, Quantity]]:
        return {
        "bid": dict(self.bids),
        "ask": dict(self.asks),
    }
    def midprice(self) -> Optional[float]:
        bid = self.best_bid()
        ask = self.best_ask()
        if bid is None or ask is None:
            return None
        return (bid + ask) / 2


    def reset(self) -> None:
        self.bids.clear()
        self.asks.clear()
