"""
main.py – Entry point for the Pokémon-style monster collecting game.
Run with:  python game/main.py
"""
from __future__ import annotations

import json
import os
import sys

# Make sure the package root is on the path regardless of working directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from game.models.player import Player
from game.models.creature import Creature
from game.models.item import CaptureDevice
from game.data.creatures import make_creature, STARTERS, CREATURE_TEMPLATES
from game.data.items import get_item, STARTING_ITEMS
from game.data.areas import AREAS
from game.systems.battle import Battle, BattleResult
from game.systems.encounter import roll_encounter, forced_encounter
from game.systems.inventory import use_item_on_creature, list_usable_items
from game.systems.experience import moves_to_learn
from game.systems.evolution import check_evolution, evolve
from game.utils.helpers import (
    clear, header, divider, print_creature_summary, print_party,
    print_move_list, print_inventory, print_battle_status,
    prompt, choose, choose_or_cancel, press_enter, yes_no, print_wrapped,
)

SAVE_FILE = os.path.join(os.path.dirname(__file__), "..", "savegame.json")


# ---------------------------------------------------------------------------
# Save / Load
# ---------------------------------------------------------------------------

def save_game(player: Player):
    data = player.to_dict()
    with open(SAVE_FILE, "w") as f:
        json.dump(data, f, indent=2)
    print("\n  Game saved! ✓")


def load_game() -> Player | None:
    if not os.path.exists(SAVE_FILE):
        return None
    try:
        with open(SAVE_FILE) as f:
            data = json.load(f)
        return Player.from_dict(data)
    except Exception as e:
        print(f"  Failed to load save: {e}")
        return None


# ---------------------------------------------------------------------------
# New game setup
# ---------------------------------------------------------------------------

def new_game() -> Player:
    clear()
    header("Welcome to CreatureQuest!")
    print_wrapped(
        "Embark on an adventure to collect, train, and battle unique creatures "
        "across the land.  Choose your starting companion and begin your journey!"
    )
    divider()

    name = ""
    while not name:
        name = prompt("Enter your trainer name").strip()
    player = Player(name)

    # Give starting items
    for item_id, qty in STARTING_ITEMS:
        player.add_item(get_item(item_id, qty))

    # Choose starter
    print("\n  Choose your starter creature:\n")
    starter_options = [
        f"Emberpup  [Fire]  – A fiery pup with burning spirit",
        f"Splashlet [Water] – A bubbly creature of the sea",
        f"Sproutling[Grass] – A curious little sprout",
    ]
    idx = choose(starter_options, "Choose your starter")
    starter_key = list(STARTERS.keys())[idx]
    starter = make_creature(STARTERS[starter_key], 5)
    player.add_to_party(starter)

    print(f"\n  {player.name} received {starter.name}! Let the adventure begin!")
    press_enter()
    return player


# ---------------------------------------------------------------------------
# Move learning prompt
# ---------------------------------------------------------------------------

def handle_move_learning(creature: Creature):
    """Interactive move learning after level-up."""
    new_moves = moves_to_learn(creature)
    for move_name in new_moves:
        from game.data.moves import get_move
        new_move = get_move(move_name)
        print(f"\n  {creature.name} wants to learn {new_move}!")
        if len(creature.moves) < creature.MAX_MOVES:
            creature.learn_move(new_move)
            print(f"  {creature.name} learned {move_name}!")
        else:
            print(f"  {creature.name} already knows 4 moves.")
            if yes_no(f"  Replace a move to learn {move_name}?"):
                print_move_list(creature)
                idx = choose(
                    [m.name for m in creature.moves],
                    "Which move to forget?"
                )
                forgotten = creature.moves[idx].name
                creature.learn_move(new_move, replace_index=idx)
                print(f"  {creature.name} forgot {forgotten} and learned {move_name}!")
            else:
                print(f"  {creature.name} did not learn {move_name}.")


# ---------------------------------------------------------------------------
# Battle screen
# ---------------------------------------------------------------------------

def run_battle(player: Player, wild: Creature) -> BattleResult:
    battle = Battle(player, wild, is_wild=True)

    while battle.result is None:
        clear()
        print_battle_status(battle.active, wild)
        print_move_list(battle.active)

        options = ["Fight", "Item", "Switch", "Run"]
        action = choose(options, "What will you do?")

        if action == 0:  # Fight
            print_move_list(battle.active)
            move_opts = [str(m) for m in battle.active.moves]
            move_idx = choose_or_cancel(move_opts, "Choose a move")
            if move_idx is None:
                continue
            msgs = battle.player_fight(move_idx)

        elif action == 1:  # Item
            items = list_usable_items(player, in_battle=True)
            if not items:
                print("\n  You have no usable items!")
                press_enter()
                continue
            item_opts = [str(i) for i in items]
            item_idx = choose_or_cancel(item_opts, "Choose an item")
            if item_idx is None:
                continue
            chosen_item = items[item_idx]
            if isinstance(chosen_item, CaptureDevice):
                msgs = battle.player_use_item(chosen_item.item_id, 0)
            else:
                # Choose target creature
                alive_party = [(i, c) for i, c in enumerate(player.party) if not c.is_fainted]
                party_opts = [f"{c.name} ({c.current_hp}/{c.max_hp} HP)" for _, c in alive_party]
                pidx = choose(party_opts, "Use on which creature?")
                real_idx, target = alive_party[pidx]
                msgs = battle.player_use_item(chosen_item.item_id, real_idx)

        elif action == 2:  # Switch
            switchable = [
                (i, c) for i, c in enumerate(player.party)
                if not c.is_fainted and c is not battle.active
            ]
            if not switchable:
                print("\n  No other creatures available to switch to!")
                press_enter()
                continue
            sw_opts = [f"{c.name} ({c.current_hp}/{c.max_hp} HP)" for _, c in switchable]
            sw_idx = choose_or_cancel(sw_opts, "Switch to?")
            if sw_idx is None:
                continue
            real_idx, _ = switchable[sw_idx]
            msgs = battle.player_switch(real_idx)

        elif action == 3:  # Run
            msgs = battle.player_run()

        # Print messages
        print()
        for msg in msgs:
            print(f"  {msg}")

        # Handle new move learning after battle messages
        if battle.result == BattleResult.PLAYER_WIN:
            handle_move_learning(battle.active)

        if battle.result is not None:
            break

        press_enter()

    # Battle ended
    print()
    if battle.result == BattleResult.CAPTURED:
        captured = wild
        if len(player.party) < Player.MAX_PARTY:
            player.add_to_party(captured)
            print(f"  {captured.name} joined your party!")
        else:
            print(f"  Your party is full! {captured.name} was released.")
        press_enter()
    elif battle.result == BattleResult.PLAYER_WIN:
        press_enter()
    elif battle.result == BattleResult.PLAYER_LOSE:
        print("\n  You were defeated... Your creatures were healed at the nearest rest stop.")
        player.heal_party()
        player.current_area = "starter_town"
        press_enter()
    elif battle.result == BattleResult.ESCAPED:
        press_enter()

    return battle.result


# ---------------------------------------------------------------------------
# Exploration
# ---------------------------------------------------------------------------

def explore(player: Player):
    while True:
        clear()
        area = AREAS[player.current_area]
        header(f"Exploring: {area.name}")
        print_wrapped(area.description)
        divider()

        options = ["Search for creatures"]
        if area.connects_to:
            options.append("Travel to another area")
        options.append("Back to main menu")

        action = choose(options, "What will you do?")

        if options[action] == "Search for creatures":
            if not area.encounters:
                print("\n  There are no wild creatures here.")
                press_enter()
                continue

            print("\n  You venture into the wild...")
            wild = forced_encounter(player.current_area)
            if wild:
                print(f"\n  A wild {wild.name} (Lv.{wild.level}) appeared!")
                press_enter()
                run_battle(player, wild)
                if player.all_fainted():
                    return  # bail out to main menu after loss-heal
            else:
                print("  No creatures found. Try again!")
                press_enter()

        elif options[action] == "Travel to another area":
            dest_ids = area.connects_to
            dest_names = [AREAS[d].name for d in dest_ids]
            dest_idx = choose_or_cancel(dest_names, "Travel to?", "Stay here")
            if dest_idx is not None:
                player.current_area = dest_ids[dest_idx]
                print(f"\n  You traveled to {AREAS[player.current_area].name}!")
                press_enter()

        elif options[action] == "Back to main menu":
            break


# ---------------------------------------------------------------------------
# View Party / Inventory
# ---------------------------------------------------------------------------

def view_party(player: Player):
    while True:
        clear()
        print_party(player)
        options = [c.name for c in player.party] + ["Back"]
        idx = choose(options, "View creature details (or Back)")
        if idx == len(player.party):
            break
        clear()
        header(f"{player.party[idx].name} – Details")
        print_creature_summary(player.party[idx])
        print_move_list(player.party[idx])
        press_enter()


def view_inventory(player: Player):
    clear()
    print_inventory(player)
    # Allow using items outside of battle
    items = [i for i in player.inventory if i.quantity > 0]
    if not items:
        press_enter()
        return

    if not yes_no("Use an item?"):
        return

    usable = list_usable_items(player, in_battle=False)
    if not usable:
        print("  No usable items right now.")
        press_enter()
        return

    item_opts = [str(i) for i in usable]
    item_idx = choose_or_cancel(item_opts, "Which item?")
    if item_idx is None:
        return
    chosen = usable[item_idx]

    alive = [(i, c) for i, c in enumerate(player.party) if not c.is_fainted]
    if not alive:
        print("  All your creatures have fainted!")
        press_enter()
        return

    party_opts = [f"{c.name} ({c.current_hp}/{c.max_hp} HP)" for _, c in alive]
    pidx = choose(party_opts, "Use on which creature?")
    real_idx, target = alive[pidx]
    msg = use_item_on_creature(player, chosen.item_id, target)
    print(f"\n  {msg}")
    press_enter()


# ---------------------------------------------------------------------------
# Rest area (heal party)
# ---------------------------------------------------------------------------

def heal_at_rest_stop(player: Player):
    clear()
    header("Rest Stop")
    print("  A kind healer restores all your creatures to full health!")
    player.heal_party()
    for c in player.party:
        print(f"  {c.name} fully healed!  HP: {c.current_hp}/{c.max_hp}")
    press_enter()


# ---------------------------------------------------------------------------
# Main menu
# ---------------------------------------------------------------------------

def main_menu(player: Player):
    while True:
        clear()
        header(f"CreatureQuest  –  Trainer: {player.name}")
        area_name = AREAS.get(player.current_area, AREAS["starter_town"]).name
        print(f"  Location: {area_name}")
        print(f"  Party: {len(player.party)} creature(s)")
        divider()

        options = [
            "Explore",
            "View Party",
            "View Inventory",
            "Heal Party (Rest Stop)",
            "Save Game",
            "Quit",
        ]
        action = choose(options, "Main menu")

        if action == 0:
            explore(player)
        elif action == 1:
            view_party(player)
        elif action == 2:
            view_inventory(player)
        elif action == 3:
            heal_at_rest_stop(player)
        elif action == 4:
            save_game(player)
            press_enter()
        elif action == 5:
            if yes_no("Save before quitting?"):
                save_game(player)
            print("\n  Thanks for playing CreatureQuest!  Goodbye!\n")
            sys.exit(0)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    clear()
    header("CreatureQuest")
    print()

    existing = load_game()
    if existing:
        print(f"  Found save file for trainer: {existing.name}")
        if yes_no("  Continue saved game?"):
            main_menu(existing)
            return

    player = new_game()
    main_menu(player)


if __name__ == "__main__":
    main()
