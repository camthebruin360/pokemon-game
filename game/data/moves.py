"""Database of all moves (30+ moves across all types)."""
from game.models.move import Move

# ---------------------------------------------------------------------------
# Normal
# ---------------------------------------------------------------------------
TACKLE    = Move("Tackle",       "Normal",   40, 100, 35, "physical")
SCRATCH   = Move("Scratch",      "Normal",   40, 100, 35, "physical")
SLAM      = Move("Slam",         "Normal",   80,  75, 20, "physical")
BODY_SLAM = Move("Body Slam",    "Normal",   85, 100, 15, "physical")
SWIFT     = Move("Swift",        "Normal",   60, 100, 20, "special")
HYPER_BEAM = Move("Hyper Beam",  "Normal",  150,  90,  5, "special")

# ---------------------------------------------------------------------------
# Fire
# ---------------------------------------------------------------------------
EMBER        = Move("Ember",         "Fire",  40, 100, 25, "special")
FLAME_BURST  = Move("Flame Burst",   "Fire",  70,  85, 15, "special")
FIRE_BLAST   = Move("Fire Blast",    "Fire", 110,  85,  5, "special")
INFERNO      = Move("Inferno",       "Fire", 100,  50,  5, "special")
HEAT_FANG    = Move("Heat Fang",     "Fire",  65,  95, 15, "physical")
FLARE_CLAW   = Move("Flare Claw",    "Fire",  80,  90, 10, "physical")

# ---------------------------------------------------------------------------
# Water
# ---------------------------------------------------------------------------
WATER_GUN   = Move("Water Gun",   "Water",  40, 100, 25, "special")
BUBBLE_BEAM = Move("Bubble Beam", "Water",  65, 100, 20, "special")
SURF        = Move("Surf",        "Water",  90, 100, 15, "special")
HYDRO_PUMP  = Move("Hydro Pump",  "Water", 110,  80,  5, "special")
AQUA_SLASH  = Move("Aqua Slash",  "Water",  70,  95, 10, "physical")
TIDAL_CRASH = Move("Tidal Crash", "Water",  95,  85, 10, "physical")

# ---------------------------------------------------------------------------
# Grass
# ---------------------------------------------------------------------------
VINE_WHIP    = Move("Vine Whip",    "Grass",  45, 100, 25, "physical")
RAZOR_LEAF   = Move("Razor Leaf",   "Grass",  55,  95, 25, "physical")
PETAL_STORM  = Move("Petal Storm",  "Grass",  80,  90, 10, "special")
SOLAR_BLAST  = Move("Solar Blast",  "Grass", 120,  85,  5, "special")
THORN_WHIP   = Move("Thorn Whip",   "Grass",  65,  95, 15, "physical")
LEAF_TORNADO = Move("Leaf Tornado", "Grass",  65,  90, 10, "special")

# ---------------------------------------------------------------------------
# Electric
# ---------------------------------------------------------------------------
SPARK         = Move("Spark",         "Electric",  40, 100, 30, "physical")
THUNDER_SHOCK = Move("Thunder Shock", "Electric",  40, 100, 30, "special")
BOLT_STRIKE   = Move("Bolt Strike",   "Electric",  85,  90, 10, "special")
THUNDERBOLT   = Move("Thunderbolt",   "Electric",  90, 100, 15, "special")
THUNDER       = Move("Thunder",       "Electric", 110,  70, 10, "special")

# ---------------------------------------------------------------------------
# Ice
# ---------------------------------------------------------------------------
POWDER_SNOW = Move("Powder Snow", "Ice",  40, 100, 25, "special")
ICE_SHARD   = Move("Ice Shard",   "Ice",  40, 100, 30, "physical")
BLIZZARD    = Move("Blizzard",    "Ice", 110,  70,  5, "special")
ICY_FANG    = Move("Icy Fang",    "Ice",  65,  95, 15, "physical")
FROST_BEAM  = Move("Frost Beam",  "Ice",  85,  90, 10, "special")

# ---------------------------------------------------------------------------
# Fighting
# ---------------------------------------------------------------------------
JABS          = Move("Jabs",         "Fighting",  40, 100, 30, "physical")
POWER_PUNCH   = Move("Power Punch",  "Fighting",  75, 100, 15, "physical")
CLOSE_COMBAT  = Move("Close Combat", "Fighting", 120, 100,  5, "physical")
SLAM_DOWN     = Move("Slam Down",    "Fighting",  80, 100, 10, "physical")

# ---------------------------------------------------------------------------
# Psychic
# ---------------------------------------------------------------------------
CONFUSION    = Move("Confusion",    "Psychic",  50, 100, 25, "special")
PSYBEAM      = Move("Psybeam",      "Psychic",  65, 100, 20, "special")
PSYCHO_BLAST = Move("Psycho Blast", "Psychic",  90, 100, 10, "special")
MIND_BREAK   = Move("Mind Break",   "Psychic", 110,  85,  5, "special")

# ---------------------------------------------------------------------------
# Look-up table  name → Move
# ---------------------------------------------------------------------------
MOVE_DB: dict = {
    m.name: m for m in [
        TACKLE, SCRATCH, SLAM, BODY_SLAM, SWIFT, HYPER_BEAM,
        EMBER, FLAME_BURST, FIRE_BLAST, INFERNO, HEAT_FANG, FLARE_CLAW,
        WATER_GUN, BUBBLE_BEAM, SURF, HYDRO_PUMP, AQUA_SLASH, TIDAL_CRASH,
        VINE_WHIP, RAZOR_LEAF, PETAL_STORM, SOLAR_BLAST, THORN_WHIP, LEAF_TORNADO,
        SPARK, THUNDER_SHOCK, BOLT_STRIKE, THUNDERBOLT, THUNDER,
        POWDER_SNOW, ICE_SHARD, BLIZZARD, ICY_FANG, FROST_BEAM,
        JABS, POWER_PUNCH, CLOSE_COMBAT, SLAM_DOWN,
        CONFUSION, PSYBEAM, PSYCHO_BLAST, MIND_BREAK,
    ]
}


def get_move(name: str) -> Move:
    """Return a fresh copy of a move by name."""
    import copy
    m = MOVE_DB.get(name)
    if m is None:
        raise KeyError(f"Move '{name}' not found in database.")
    return copy.deepcopy(m)
