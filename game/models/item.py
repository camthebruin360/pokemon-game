"""Item classes for the inventory system."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Optional


@dataclass
class Item:
    item_id: str
    name: str
    description: str
    category: str           # "healing" | "capture" | "revive" | "pp"
    quantity: int = 0

    def to_dict(self) -> dict:
        return {
            "item_id": self.item_id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "quantity": self.quantity,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Item":
        return cls(
            item_id=d["item_id"],
            name=d["name"],
            description=d["description"],
            category=d["category"],
            quantity=d.get("quantity", 0),
        )

    def __str__(self):
        return f"{self.name} x{self.quantity} – {self.description}"


class HealingItem(Item):
    """Restores HP to a creature."""

    def __init__(self, item_id: str, name: str, description: str,
                 heal_amount: int, quantity: int = 0):
        super().__init__(item_id, name, description, "healing", quantity)
        self.heal_amount = heal_amount

    def use_on(self, creature) -> str:
        if creature.is_fainted:
            return f"{creature.name} has fainted and cannot be healed this way!"
        if creature.current_hp == creature.max_hp:
            return f"{creature.name}'s HP is already full!"
        healed = min(self.heal_amount, creature.max_hp - creature.current_hp)
        creature.heal(self.heal_amount)
        return f"{creature.name} recovered {healed} HP!"

    def to_dict(self) -> dict:
        d = super().to_dict()
        d["heal_amount"] = self.heal_amount
        return d

    @classmethod
    def from_dict(cls, d: dict) -> "HealingItem":
        return cls(
            item_id=d["item_id"],
            name=d["name"],
            description=d["description"],
            heal_amount=d["heal_amount"],
            quantity=d.get("quantity", 0),
        )


class ReviveItem(Item):
    """Revives a fainted creature."""

    def __init__(self, item_id: str, name: str, description: str,
                 revive_fraction: float = 0.5, quantity: int = 0):
        super().__init__(item_id, name, description, "revive", quantity)
        self.revive_fraction = revive_fraction

    def use_on(self, creature) -> str:
        if not creature.is_fainted:
            return f"{creature.name} hasn't fainted!"
        hp = int(creature.max_hp * self.revive_fraction)
        creature.revive(hp)
        return f"{creature.name} was revived with {hp} HP!"

    def to_dict(self) -> dict:
        d = super().to_dict()
        d["revive_fraction"] = self.revive_fraction
        return d

    @classmethod
    def from_dict(cls, d: dict) -> "ReviveItem":
        return cls(
            item_id=d["item_id"],
            name=d["name"],
            description=d["description"],
            revive_fraction=d["revive_fraction"],
            quantity=d.get("quantity", 0),
        )


class CaptureDevice(Item):
    """Used to capture wild creatures."""

    def __init__(self, item_id: str, name: str, description: str,
                 catch_rate: float = 1.0, quantity: int = 0):
        super().__init__(item_id, name, description, "capture", quantity)
        self.catch_rate = catch_rate   # multiplier on capture probability

    def to_dict(self) -> dict:
        d = super().to_dict()
        d["catch_rate"] = self.catch_rate
        return d

    @classmethod
    def from_dict(cls, d: dict) -> "CaptureDevice":
        return cls(
            item_id=d["item_id"],
            name=d["name"],
            description=d["description"],
            catch_rate=d["catch_rate"],
            quantity=d.get("quantity", 0),
        )


def item_from_dict(d: dict) -> Item:
    """Deserialise any Item subclass from a dict."""
    cat = d.get("category", "healing")
    if cat == "healing":
        return HealingItem.from_dict(d)
    if cat == "revive":
        return ReviveItem.from_dict(d)
    if cat == "capture":
        return CaptureDevice.from_dict(d)
    return Item.from_dict(d)
