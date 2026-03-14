"""Database of all creatures (15-20 unique creatures with evolutions)."""
from __future__ import annotations

import copy
from typing import List, Optional

from game.models.creature import Creature
from game.data.moves import get_move

# ---------------------------------------------------------------------------
# Creature template definitions
# Each entry: species_id → (name, types, base_stats, base_exp_yield,
#                            level_moves, evolution_level, evolution_id)
# level_moves: list of (min_level, move_name)
# ---------------------------------------------------------------------------

CREATURE_TEMPLATES = {

    # === Fire Starters ===
    "emberpup": {
        "name": "Emberpup",
        "types": ["Fire"],
        "base_stats": {"hp": 45, "atk": 52, "def": 43, "spatk": 60, "spdef": 50, "spd": 65},
        "base_exp_yield": 62,
        "level_moves": [(1, "Scratch"), (1, "Ember"), (7, "Tackle"), (13, "Flame Burst"), (20, "Flare Claw"), (28, "Fire Blast")],
        "evolution_level": 16,
        "evolution_id": "blazehound",
    },
    "blazehound": {
        "name": "Blazehound",
        "types": ["Fire"],
        "base_stats": {"hp": 58, "atk": 64, "def": 58, "spatk": 80, "spdef": 65, "spd": 80},
        "base_exp_yield": 142,
        "level_moves": [(1, "Scratch"), (1, "Ember"), (13, "Flame Burst"), (20, "Flare Claw"), (28, "Fire Blast"), (38, "Heat Fang")],
        "evolution_level": 36,
        "evolution_id": "infernowolf",
    },
    "infernowolf": {
        "name": "Infernowolf",
        "types": ["Fire"],
        "base_stats": {"hp": 78, "atk": 84, "def": 78, "spatk": 109, "spdef": 85, "spd": 100},
        "base_exp_yield": 240,
        "level_moves": [(1, "Flare Claw"), (1, "Fire Blast"), (38, "Heat Fang"), (45, "Inferno"), (55, "Hyper Beam")],
        "evolution_level": None,
        "evolution_id": None,
    },

    # === Water Starters ===
    "splashlet": {
        "name": "Splashlet",
        "types": ["Water"],
        "base_stats": {"hp": 44, "atk": 48, "def": 65, "spatk": 50, "spdef": 64, "spd": 43},
        "base_exp_yield": 63,
        "level_moves": [(1, "Tackle"), (1, "Water Gun"), (9, "Bubble Beam"), (15, "Aqua Slash"), (22, "Surf"), (30, "Hydro Pump")],
        "evolution_level": 16,
        "evolution_id": "tidecrest",
    },
    "tidecrest": {
        "name": "Tidecrest",
        "types": ["Water"],
        "base_stats": {"hp": 59, "atk": 63, "def": 80, "spatk": 65, "spdef": 80, "spd": 58},
        "base_exp_yield": 142,
        "level_moves": [(1, "Water Gun"), (1, "Bubble Beam"), (15, "Aqua Slash"), (22, "Surf"), (30, "Hydro Pump"), (40, "Tidal Crash")],
        "evolution_level": 36,
        "evolution_id": "tsunamaw",
    },
    "tsunamaw": {
        "name": "Tsunamaw",
        "types": ["Water"],
        "base_stats": {"hp": 79, "atk": 83, "def": 100, "spatk": 85, "spdef": 105, "spd": 78},
        "base_exp_yield": 239,
        "level_moves": [(1, "Surf"), (1, "Tidal Crash"), (40, "Hydro Pump"), (48, "Aqua Slash"), (55, "Hyper Beam")],
        "evolution_level": None,
        "evolution_id": None,
    },

    # === Grass Starters ===
    "sproutling": {
        "name": "Sproutling",
        "types": ["Grass"],
        "base_stats": {"hp": 45, "atk": 49, "def": 49, "spatk": 65, "spdef": 65, "spd": 45},
        "base_exp_yield": 64,
        "level_moves": [(1, "Tackle"), (1, "Vine Whip"), (7, "Razor Leaf"), (13, "Thorn Whip"), (20, "Petal Storm"), (30, "Leaf Tornado")],
        "evolution_level": 16,
        "evolution_id": "thornvine",
    },
    "thornvine": {
        "name": "Thornvine",
        "types": ["Grass"],
        "base_stats": {"hp": 60, "atk": 62, "def": 63, "spatk": 80, "spdef": 80, "spd": 60},
        "base_exp_yield": 141,
        "level_moves": [(1, "Vine Whip"), (1, "Razor Leaf"), (13, "Thorn Whip"), (20, "Petal Storm"), (30, "Leaf Tornado"), (40, "Solar Blast")],
        "evolution_level": 36,
        "evolution_id": "forestitan",
    },
    "forestitan": {
        "name": "Forestitan",
        "types": ["Grass"],
        "base_stats": {"hp": 80, "atk": 82, "def": 83, "spatk": 100, "spdef": 100, "spd": 80},
        "base_exp_yield": 236,
        "level_moves": [(1, "Razor Leaf"), (1, "Solar Blast"), (40, "Leaf Tornado"), (48, "Petal Storm"), (55, "Hyper Beam")],
        "evolution_level": None,
        "evolution_id": None,
    },

    # === Wild Creatures ===
    "zappeling": {
        "name": "Zappeling",
        "types": ["Electric"],
        "base_stats": {"hp": 40, "atk": 45, "def": 35, "spatk": 55, "spdef": 40, "spd": 90},
        "base_exp_yield": 82,
        "level_moves": [(1, "Tackle"), (1, "Thunder Shock"), (7, "Spark"), (15, "Thunderbolt"), (25, "Thunder")],
        "evolution_level": 20,
        "evolution_id": "voltmane",
    },
    "voltmane": {
        "name": "Voltmane",
        "types": ["Electric"],
        "base_stats": {"hp": 60, "atk": 65, "def": 55, "spatk": 90, "spdef": 60, "spd": 110},
        "base_exp_yield": 172,
        "level_moves": [(1, "Thunder Shock"), (1, "Thunderbolt"), (25, "Bolt Strike"), (35, "Thunder"), (45, "Hyper Beam")],
        "evolution_level": None,
        "evolution_id": None,
    },
    "frostbite": {
        "name": "Frostbite",
        "types": ["Ice"],
        "base_stats": {"hp": 50, "atk": 55, "def": 50, "spatk": 65, "spdef": 55, "spd": 50},
        "base_exp_yield": 90,
        "level_moves": [(1, "Tackle"), (1, "Powder Snow"), (8, "Ice Shard"), (16, "Icy Fang"), (25, "Frost Beam"), (35, "Blizzard")],
        "evolution_level": 28,
        "evolution_id": "glacihorn",
    },
    "glacihorn": {
        "name": "Glacihorn",
        "types": ["Ice"],
        "base_stats": {"hp": 75, "atk": 75, "def": 75, "spatk": 90, "spdef": 75, "spd": 70},
        "base_exp_yield": 188,
        "level_moves": [(1, "Ice Shard"), (1, "Frost Beam"), (35, "Blizzard"), (45, "Hyper Beam")],
        "evolution_level": None,
        "evolution_id": None,
    },
    "punchkin": {
        "name": "Punchkin",
        "types": ["Fighting"],
        "base_stats": {"hp": 70, "atk": 80, "def": 50, "spatk": 35, "spdef": 35, "spd": 35},
        "base_exp_yield": 88,
        "level_moves": [(1, "Jabs"), (1, "Tackle"), (9, "Power Punch"), (20, "Slam Down"), (32, "Close Combat"), (42, "Body Slam")],
        "evolution_level": 28,
        "evolution_id": "brutalux",
    },
    "brutalux": {
        "name": "Brutalux",
        "types": ["Fighting"],
        "base_stats": {"hp": 90, "atk": 110, "def": 70, "spatk": 55, "spdef": 55, "spd": 55},
        "base_exp_yield": 191,
        "level_moves": [(1, "Power Punch"), (1, "Close Combat"), (32, "Slam Down"), (42, "Body Slam"), (50, "Hyper Beam")],
        "evolution_level": None,
        "evolution_id": None,
    },
    "psywisp": {
        "name": "Psywisp",
        "types": ["Psychic"],
        "base_stats": {"hp": 38, "atk": 35, "def": 35, "spatk": 65, "spdef": 55, "spd": 50},
        "base_exp_yield": 75,
        "level_moves": [(1, "Confusion"), (1, "Tackle"), (10, "Psybeam"), (22, "Psycho Blast"), (35, "Mind Break")],
        "evolution_level": 25,
        "evolution_id": "mentarex",
    },
    "mentarex": {
        "name": "Mentarex",
        "types": ["Psychic"],
        "base_stats": {"hp": 58, "atk": 55, "def": 55, "spatk": 105, "spdef": 85, "spd": 70},
        "base_exp_yield": 186,
        "level_moves": [(1, "Psybeam"), (1, "Psycho Blast"), (35, "Mind Break"), (45, "Hyper Beam")],
        "evolution_level": None,
        "evolution_id": None,
    },
    "rockbiter": {
        "name": "Rockbiter",
        "types": ["Normal"],
        "base_stats": {"hp": 80, "atk": 55, "def": 90, "spatk": 40, "spdef": 70, "spd": 25},
        "base_exp_yield": 95,
        "level_moves": [(1, "Tackle"), (1, "Slam"), (12, "Body Slam"), (24, "Slam Down"), (36, "Hyper Beam")],
        "evolution_level": None,
        "evolution_id": None,
    },
    "swiftail": {
        "name": "Swiftail",
        "types": ["Normal"],
        "base_stats": {"hp": 55, "atk": 60, "def": 45, "spatk": 50, "spdef": 50, "spd": 95},
        "base_exp_yield": 85,
        "level_moves": [(1, "Scratch"), (1, "Swift"), (10, "Slam"), (20, "Body Slam"), (30, "Hyper Beam")],
        "evolution_level": None,
        "evolution_id": None,
    },
}


def _moves_for_level(species_id: str, level: int) -> List:
    """Return a list of up to 4 Move objects appropriate for a given level."""
    template = CREATURE_TEMPLATES[species_id]
    level_moves = template["level_moves"]
    # collect all moves learnable up to this level
    learnable = [
        get_move(name) for (req_lvl, name) in level_moves if req_lvl <= level
    ]
    # take the last MAX_MOVES
    return learnable[-Creature.MAX_MOVES:]


def make_creature(species_id: str, level: int) -> Creature:
    """Instantiate a Creature from its template at the given level."""
    t = CREATURE_TEMPLATES[species_id]
    moves = _moves_for_level(species_id, level)
    if not moves:
        # fallback: give tackle
        moves = [get_move("Tackle")]
    return Creature(
        species_id=species_id,
        name=t["name"],
        types=t["types"],
        base_stats=copy.deepcopy(t["base_stats"]),
        level=level,
        move_pool=moves,
        base_exp_yield=t["base_exp_yield"],
        evolution_level=t.get("evolution_level"),
        evolution_id=t.get("evolution_id"),
    )


# Import Creature here to avoid circular import at module level
from game.models.creature import Creature

# Starter choices presented to player
STARTERS = {
    "fire":  "emberpup",
    "water": "splashlet",
    "grass": "sproutling",
}
