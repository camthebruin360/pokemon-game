"""Move class – represents a single battle move."""
from dataclasses import dataclass, field


@dataclass
class Move:
    name: str
    move_type: str          # must match one of the TYPES in type_chart
    power: int              # 0 for status moves
    accuracy: int           # 0-100 (percent)
    max_pp: int
    category: str           # "physical" | "special" | "status"
    current_pp: int = field(init=False)

    def __post_init__(self):
        self.current_pp = self.max_pp

    def use(self) -> bool:
        """Consume 1 PP.  Returns False when out of PP."""
        if self.current_pp <= 0:
            return False
        self.current_pp -= 1
        return True

    def restore_pp(self, amount: int = None):
        """Restore PP – full restore when amount is None."""
        if amount is None:
            self.current_pp = self.max_pp
        else:
            self.current_pp = min(self.max_pp, self.current_pp + amount)

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "move_type": self.move_type,
            "power": self.power,
            "accuracy": self.accuracy,
            "max_pp": self.max_pp,
            "category": self.category,
            "current_pp": self.current_pp,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Move":
        m = cls(
            name=d["name"],
            move_type=d["move_type"],
            power=d["power"],
            accuracy=d["accuracy"],
            max_pp=d["max_pp"],
            category=d["category"],
        )
        m.current_pp = d.get("current_pp", m.max_pp)
        return m

    def __str__(self):
        return (
            f"{self.name} [{self.move_type}] "
            f"Pwr:{self.power} Acc:{self.accuracy}% "
            f"PP:{self.current_pp}/{self.max_pp}"
        )


# A fallback move used when all PP is depleted
STRUGGLE = Move(
    name="Struggle",
    move_type="Normal",
    power=50,
    accuracy=100,
    max_pp=999,
    category="physical",
)
