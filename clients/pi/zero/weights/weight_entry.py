from dataclasses import dataclass
import datetime


@dataclass()
class WeightEntry:
    weight_a: float
    weight_b: float
    timestamp: datetime.datetime
