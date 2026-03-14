"""Database of all items available in the game."""
from game.models.item import HealingItem, ReviveItem, CaptureDevice

# ---------------------------------------------------------------------------
# Healing Items
# ---------------------------------------------------------------------------
POTION       = HealingItem("potion",       "Potion",       "Restores 20 HP.",          heal_amount=20)
SUPER_POTION = HealingItem("super_potion", "Super Potion", "Restores 50 HP.",          heal_amount=50)
HYPER_POTION = HealingItem("hyper_potion", "Hyper Potion", "Restores 200 HP.",         heal_amount=200)
FULL_RESTORE = HealingItem("full_restore", "Full Restore", "Fully restores HP.",        heal_amount=9999)

# ---------------------------------------------------------------------------
# Revive Items
# ---------------------------------------------------------------------------
REVIVE      = ReviveItem("revive",      "Revive",      "Revives a fainted creature to 50% HP.", revive_fraction=0.5)
MAX_REVIVE  = ReviveItem("max_revive",  "Max Revive",  "Revives a fainted creature to full HP.", revive_fraction=1.0)

# ---------------------------------------------------------------------------
# Capture Devices
# ---------------------------------------------------------------------------
CAPTURE_SPHERE  = CaptureDevice("capture_sphere",  "Capture Sphere",  "A basic capture device. Catch rate x1.",   catch_rate=1.0)
GREAT_SPHERE    = CaptureDevice("great_sphere",    "Great Sphere",    "A better capture device. Catch rate x1.5.", catch_rate=1.5)
ULTRA_SPHERE    = CaptureDevice("ultra_sphere",    "Ultra Sphere",    "Top-grade device. Catch rate x2.",          catch_rate=2.0)

# ---------------------------------------------------------------------------
# Look-up table
# ---------------------------------------------------------------------------
ITEM_DB = {
    i.item_id: i for i in [
        POTION, SUPER_POTION, HYPER_POTION, FULL_RESTORE,
        REVIVE, MAX_REVIVE,
        CAPTURE_SPHERE, GREAT_SPHERE, ULTRA_SPHERE,
    ]
}


def get_item(item_id: str, quantity: int = 1):
    """Return a fresh copy of an item with the specified quantity."""
    import copy
    item = ITEM_DB.get(item_id)
    if item is None:
        raise KeyError(f"Item '{item_id}' not in database.")
    fresh = copy.deepcopy(item)
    fresh.quantity = quantity
    return fresh


# Starting items given to the player at the beginning of the game
STARTING_ITEMS = [
    ("potion", 3),
    ("capture_sphere", 5),
    ("revive", 1),
]
