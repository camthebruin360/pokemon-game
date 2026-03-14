"""Type effectiveness chart for the battle system."""

TYPES = [
    "Normal", "Fire", "Water", "Grass", "Electric",
    "Ice", "Fighting", "Psychic",
]

# type_chart[attacking_type][defending_type] = multiplier
TYPE_CHART = {
    "Normal": {
        "Normal": 1.0, "Fire": 1.0, "Water": 1.0, "Grass": 1.0,
        "Electric": 1.0, "Ice": 1.0, "Fighting": 1.0, "Psychic": 1.0,
    },
    "Fire": {
        "Normal": 1.0, "Fire": 0.5, "Water": 0.5, "Grass": 2.0,
        "Electric": 1.0, "Ice": 2.0, "Fighting": 1.0, "Psychic": 1.0,
    },
    "Water": {
        "Normal": 1.0, "Fire": 2.0, "Water": 0.5, "Grass": 0.5,
        "Electric": 1.0, "Ice": 1.0, "Fighting": 1.0, "Psychic": 1.0,
    },
    "Grass": {
        "Normal": 1.0, "Fire": 0.5, "Water": 2.0, "Grass": 0.5,
        "Electric": 1.0, "Ice": 0.5, "Fighting": 1.0, "Psychic": 1.0,
    },
    "Electric": {
        "Normal": 1.0, "Fire": 1.0, "Water": 2.0, "Grass": 0.5,
        "Electric": 0.5, "Ice": 1.0, "Fighting": 1.0, "Psychic": 1.0,
    },
    "Ice": {
        "Normal": 1.0, "Fire": 0.5, "Water": 0.5, "Grass": 2.0,
        "Electric": 1.0, "Ice": 0.5, "Fighting": 1.0, "Psychic": 1.0,
    },
    "Fighting": {
        "Normal": 2.0, "Fire": 1.0, "Water": 1.0, "Grass": 1.0,
        "Electric": 1.0, "Ice": 2.0, "Fighting": 1.0, "Psychic": 0.5,
    },
    "Psychic": {
        "Normal": 1.0, "Fire": 1.0, "Water": 1.0, "Grass": 1.0,
        "Electric": 1.0, "Ice": 1.0, "Fighting": 2.0, "Psychic": 0.5,
    },
}


def get_effectiveness(attacking_type: str, defending_types: list) -> float:
    """Return the combined type multiplier for an attack against a defender."""
    multiplier = 1.0
    chart = TYPE_CHART.get(attacking_type, {})
    for def_type in defending_types:
        multiplier *= chart.get(def_type, 1.0)
    return multiplier


def effectiveness_label(multiplier: float) -> str:
    """Return a human-readable effectiveness label."""
    if multiplier == 0.0:
        return "It has no effect!"
    if multiplier >= 2.0:
        return "It's super effective!"
    if multiplier <= 0.5:
        return "It's not very effective..."
    return ""
