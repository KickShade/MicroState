from dataclasses import dataclass
from enum import Enum
from typing import Literal


class EventType(str, Enum):
    ADD = "add"
    CANCEL = "cancel"
    MODIFY = "modify"


@dataclass(frozen=True)
class BookEvent:
    timestamp: int
    side: Literal["bid", "ask"]
    price: float
    prev_qty: float
    new_qty: float
    event_type: EventType
