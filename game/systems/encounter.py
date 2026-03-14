"""Wild encounter system – area-based random encounters."""
from __future__ import annotations

import random
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from game.models.player import Player
    from game.models.creature import Creature


def roll_encounter(area_id: str) -> Optional["Creature"]:
    """
    Roll for a wild encounter in the given area.
    Returns a wild Creature, or None if no encounter triggered.
    """
    from game.data.areas import AREAS
    from game.data.creatures import make_creature

    area = AREAS.get(area_id)
    if area is None or not area.encounters:
        return None

    # 40% chance of an encounter per roll
    if random.random() > 0.40:
        return None

    # Weighted random choice
    total_weight = sum(e.weight for e in area.encounters)
    roll = random.randint(1, total_weight)
    cumulative = 0
    for entry in area.encounters:
        cumulative += entry.weight
        if roll <= cumulative:
            lvl = random.randint(entry.min_level, entry.max_level)
            return make_creature(entry.species_id, lvl)

    return None


def forced_encounter(area_id: str) -> Optional["Creature"]:
    """
    Force an encounter in the given area (100% chance).
    Returns None only if the area has no encounters.
    """
    from game.data.areas import AREAS
    from game.data.creatures import make_creature

    area = AREAS.get(area_id)
    if area is None or not area.encounters:
        return None

    total_weight = sum(e.weight for e in area.encounters)
    roll = random.randint(1, total_weight)
    cumulative = 0
    for entry in area.encounters:
        cumulative += entry.weight
        if roll <= cumulative:
            lvl = random.randint(entry.min_level, entry.max_level)
            return make_creature(entry.species_id, lvl)

    return None
