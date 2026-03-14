"""Experience and levelling system."""
from __future__ import annotations
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from game.models.creature import Creature


def exp_gained(enemy: "Creature") -> int:
    """Calculate experience given to the winning side."""
    return max(1, (enemy.base_exp_yield * enemy.level) // 5)


def apply_exp(creature: "Creature", amount: int) -> List[str]:
    """
    Apply experience to a creature.
    Returns log messages (level-up notifications, etc.).
    """
    return creature.gain_exp(amount)


def moves_to_learn(creature: "Creature") -> List[str]:
    """
    Return names of moves that this creature is now eligible to learn
    (based on its current level) but doesn't currently know.
    """
    from game.data.creatures import CREATURE_TEMPLATES
    template = CREATURE_TEMPLATES.get(creature.species_id)
    if not template:
        return []
    known = {m.name for m in creature.moves}
    to_learn = []
    for (req_level, move_name) in template["level_moves"]:
        if req_level == creature.level and move_name not in known:
            to_learn.append(move_name)
    return to_learn
