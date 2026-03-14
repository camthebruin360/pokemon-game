"""Database of areas/routes with encounter tables."""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Tuple


@dataclass
class EncounterEntry:
    species_id: str
    min_level: int
    max_level: int
    weight: int          # relative probability weight


@dataclass
class Area:
    area_id: str
    name: str
    description: str
    encounters: List[EncounterEntry] = field(default_factory=list)
    connects_to: List[str] = field(default_factory=list)


AREAS = {
    "starter_town": Area(
        area_id="starter_town",
        name="Starter Town",
        description="A peaceful little town nestled at the foot of the mountains.",
        encounters=[],          # no wild encounters in town
        connects_to=["verdant_trail", "rocky_path"],
    ),
    "verdant_trail": Area(
        area_id="verdant_trail",
        name="Verdant Trail",
        description="A lush green path filled with rustling leaves.",
        encounters=[
            EncounterEntry("sproutling",  2,  6, 40),
            EncounterEntry("swiftail",    3,  7, 35),
            EncounterEntry("emberpup",    3,  7, 15),
            EncounterEntry("splashlet",   3,  7, 10),
        ],
        connects_to=["starter_town", "ember_caves", "crystal_lake"],
    ),
    "rocky_path": Area(
        area_id="rocky_path",
        name="Rocky Path",
        description="A rugged trail through jagged rocks.",
        encounters=[
            EncounterEntry("rockbiter",   4, 10, 40),
            EncounterEntry("punchkin",    5, 10, 30),
            EncounterEntry("swiftail",    4,  9, 30),
        ],
        connects_to=["starter_town", "frozen_peaks"],
    ),
    "ember_caves": Area(
        area_id="ember_caves",
        name="Ember Caves",
        description="Glowing caves filled with volcanic heat.",
        encounters=[
            EncounterEntry("emberpup",    8, 16, 40),
            EncounterEntry("blazehound", 16, 26, 20),
            EncounterEntry("rockbiter",  10, 18, 30),
            EncounterEntry("zappeling",   8, 15, 10),
        ],
        connects_to=["verdant_trail", "thunder_plains"],
    ),
    "crystal_lake": Area(
        area_id="crystal_lake",
        name="Crystal Lake",
        description="A serene lake with crystal-clear water.",
        encounters=[
            EncounterEntry("splashlet",   6, 14, 45),
            EncounterEntry("tidecrest",  14, 24, 20),
            EncounterEntry("frostbite",   8, 16, 25),
            EncounterEntry("swiftail",    6, 12, 10),
        ],
        connects_to=["verdant_trail", "frozen_peaks"],
    ),
    "frozen_peaks": Area(
        area_id="frozen_peaks",
        name="Frozen Peaks",
        description="Snow-capped mountains where blizzards rage.",
        encounters=[
            EncounterEntry("frostbite",  15, 25, 40),
            EncounterEntry("glacihorn",  25, 35, 20),
            EncounterEntry("zappeling",  12, 22, 20),
            EncounterEntry("rockbiter",  15, 25, 20),
        ],
        connects_to=["rocky_path", "crystal_lake", "psychic_grove"],
    ),
    "thunder_plains": Area(
        area_id="thunder_plains",
        name="Thunder Plains",
        description="Vast open plains crackling with electricity.",
        encounters=[
            EncounterEntry("zappeling",  12, 22, 45),
            EncounterEntry("voltmane",   22, 35, 20),
            EncounterEntry("swiftail",   10, 20, 25),
            EncounterEntry("punchkin",   12, 22, 10),
        ],
        connects_to=["ember_caves", "psychic_grove"],
    ),
    "psychic_grove": Area(
        area_id="psychic_grove",
        name="Psychic Grove",
        description="A mystical forest where strange energy swirls.",
        encounters=[
            EncounterEntry("psywisp",   20, 30, 40),
            EncounterEntry("mentarex",  30, 42, 20),
            EncounterEntry("glacihorn", 28, 38, 20),
            EncounterEntry("brutalux",  28, 38, 20),
        ],
        connects_to=["frozen_peaks", "thunder_plains"],
    ),
}
