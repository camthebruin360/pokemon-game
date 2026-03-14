"""Evolution system – handles level-based evolutions."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from game.models.creature import Creature


def check_evolution(creature: "Creature") -> Optional[str]:
    """
    Check whether the creature should evolve.
    Returns the target species_id if it should evolve, otherwise None.
    """
    if (
        creature.evolution_level is not None
        and creature.level >= creature.evolution_level
        and creature.evolution_id is not None
    ):
        return creature.evolution_id
    return None


def evolve(creature: "Creature") -> "Creature":
    """
    Evolve a creature in place: updates name, types, base_stats,
    exp yield, and evolution chain from the template.
    Returns the same creature object (mutated).
    """
    from game.data.creatures import CREATURE_TEMPLATES, _moves_for_level

    target_id = creature.evolution_id
    template = CREATURE_TEMPLATES[target_id]

    # Update species info
    old_name = creature.name
    creature.species_id = target_id
    creature.name = template["name"]
    creature.types = list(template["types"])
    creature.base_exp_yield = template["base_exp_yield"]
    creature.evolution_level = template.get("evolution_level")
    creature.evolution_id = template.get("evolution_id")

    # Update base stats and recalculate
    import copy
    creature.base_stats = copy.deepcopy(template["base_stats"])
    creature.recalc_stats()

    # Merge new level-learnable moves
    new_moves = _moves_for_level(target_id, creature.level)
    known_names = {m.name for m in creature.moves}
    for move in new_moves:
        if move.name not in known_names and len(creature.moves) < creature.MAX_MOVES:
            creature.moves.append(move)
            known_names.add(move.name)

    return creature
