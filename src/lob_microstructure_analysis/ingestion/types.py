from dataclasses import dataclass


@dataclass(frozen=True)
class L2Update:
    timestamp: int      # nanoseconds
    side: str           # "bid" | "ask"
    price: float
    quantity: float
    level: int
    update_id: int
