"""Player class – holds party, inventory, and progression data."""
from __future__ import annotations

from typing import List, Dict, Optional

from game.models.creature import Creature
from game.models.item import Item, item_from_dict


class Player:
    MAX_PARTY = 6

    def __init__(self, name: str):
        self.name = name
        self.party: List[Creature] = []
        self.inventory: List[Item] = []
        self.current_area: str = "starter_town"
        self.badges: int = 0

    # ------------------------------------------------------------------
    # Party helpers
    # ------------------------------------------------------------------

    def add_to_party(self, creature: Creature) -> bool:
        if len(self.party) >= self.MAX_PARTY:
            return False
        self.party.append(creature)
        return True

    def first_alive(self) -> Optional[Creature]:
        for c in self.party:
            if not c.is_fainted:
                return c
        return None

    def all_fainted(self) -> bool:
        return all(c.is_fainted for c in self.party)

    def heal_party(self):
        for c in self.party:
            c.full_heal()
            c.restore_all_pp()
            c.current_hp = c.max_hp  # ensure consistent state

    # ------------------------------------------------------------------
    # Inventory helpers
    # ------------------------------------------------------------------

    def add_item(self, item: Item):
        for existing in self.inventory:
            if existing.item_id == item.item_id:
                existing.quantity += item.quantity
                return
        # clone with updated quantity
        import copy
        new_item = copy.deepcopy(item)
        self.inventory.append(new_item)

    def remove_item(self, item_id: str, amount: int = 1) -> bool:
        for item in self.inventory:
            if item.item_id == item_id:
                if item.quantity >= amount:
                    item.quantity -= amount
                    if item.quantity == 0:
                        self.inventory.remove(item)
                    return True
        return False

    def get_item(self, item_id: str) -> Optional[Item]:
        for item in self.inventory:
            if item.item_id == item_id:
                return item
        return None

    def has_capture_devices(self) -> bool:
        from game.models.item import CaptureDevice
        return any(
            isinstance(i, CaptureDevice) and i.quantity > 0
            for i in self.inventory
        )

    # ------------------------------------------------------------------
    # Serialisation
    # ------------------------------------------------------------------

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "current_area": self.current_area,
            "badges": self.badges,
            "party": [c.to_dict() for c in self.party],
            "inventory": [i.to_dict() for i in self.inventory],
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Player":
        p = cls(name=d["name"])
        p.current_area = d.get("current_area", "starter_town")
        p.badges = d.get("badges", 0)
        p.party = [Creature.from_dict(c) for c in d.get("party", [])]
        p.inventory = [item_from_dict(i) for i in d.get("inventory", [])]
        return p
