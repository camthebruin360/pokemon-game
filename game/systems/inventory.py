"""Inventory management system."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from game.models.player import Player
    from game.models.creature import Creature
    from game.models.item import Item


def use_item_on_creature(player: "Player", item_id: str, creature: "Creature") -> str:
    """
    Use an item from the player's inventory on the given creature.
    Returns a result message.
    """
    from game.models.item import HealingItem, ReviveItem

    item = player.get_item(item_id)
    if item is None or item.quantity <= 0:
        return "You don't have that item!"

    if isinstance(item, HealingItem):
        msg = item.use_on(creature)
        player.remove_item(item_id)
        return msg

    if isinstance(item, ReviveItem):
        msg = item.use_on(creature)
        player.remove_item(item_id)
        return msg

    return "That item can't be used on a creature!"


def list_usable_items(player: "Player", in_battle: bool = False) -> list:
    """
    Return items in player's inventory that can be used.
    In battle, exclude items that can't be used mid-fight.
    """
    from game.models.item import HealingItem, ReviveItem, CaptureDevice
    result = []
    for item in player.inventory:
        if item.quantity <= 0:
            continue
        if in_battle and isinstance(item, CaptureDevice):
            result.append(item)
        elif isinstance(item, (HealingItem, ReviveItem)):
            result.append(item)
    return result
