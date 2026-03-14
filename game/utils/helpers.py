"""Utility functions for text display and input handling."""
from __future__ import annotations

import os
import textwrap
from typing import List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from game.models.creature import Creature
    from game.models.player import Player


# ---------------------------------------------------------------------------
# Display helpers
# ---------------------------------------------------------------------------

WIDTH = 60

def clear():
    """Clear the terminal screen."""
    os.system("cls" if os.name == "nt" else "clear")


def divider(char: str = "─"):
    print(char * WIDTH)


def header(title: str):
    print("═" * WIDTH)
    print(f"  {title}")
    print("═" * WIDTH)


def print_wrapped(text: str, indent: int = 0):
    prefix = " " * indent
    for line in textwrap.wrap(text, WIDTH - indent):
        print(prefix + line)


def print_creature_summary(creature: "Creature"):
    types_str = "/".join(creature.types)
    print(f"  {creature.name}  Lv.{creature.level}  [{types_str}]")
    print(f"  HP: {creature.hp_bar()}")
    print(f"  ATK:{creature.atk} DEF:{creature.defense} "
          f"SPATK:{creature.spatk} SPDEF:{creature.spdef} SPD:{creature.spd}")
    print(f"  EXP to next level: {creature.exp_to_next()}")


def print_party(player: "Player"):
    header("Your Party")
    for i, c in enumerate(player.party):
        status = "FAINTED" if c.is_fainted else "OK"
        print(f"  [{i+1}] {c.name}  Lv.{c.level}  HP:{c.current_hp}/{c.max_hp}  [{status}]")
    divider()


def print_move_list(creature: "Creature"):
    print(f"\n  {creature.name}'s moves:")
    for i, m in enumerate(creature.moves):
        print(f"    [{i+1}] {m}")
    print()


def print_inventory(player: "Player"):
    header("Inventory")
    if not player.inventory:
        print("  (empty)")
    else:
        for i, item in enumerate(player.inventory):
            print(f"  [{i+1}] {item}")
    divider()


def print_battle_status(player_creature: "Creature", wild_creature: "Creature"):
    divider()
    print(f"  Wild {wild_creature.name}  Lv.{wild_creature.level}  "
          f"[{'/'.join(wild_creature.types)}]")
    print(f"  HP: {wild_creature.hp_bar()}")
    divider()
    print(f"  {player_creature.name}  Lv.{player_creature.level}")
    print(f"  HP: {player_creature.hp_bar()}")
    divider()


# ---------------------------------------------------------------------------
# Input helpers
# ---------------------------------------------------------------------------

def prompt(message: str) -> str:
    """Prompt the user and return stripped input."""
    return input(f"\n{message} > ").strip()


def choose(options: List[str], prompt_text: str = "Choose") -> int:
    """
    Display a numbered menu and return the 0-based index of the chosen option.
    Keeps asking until a valid choice is made.
    """
    for i, opt in enumerate(options):
        print(f"  [{i+1}] {opt}")
    while True:
        raw = input(f"\n  {prompt_text} (1-{len(options)}): ").strip()
        if raw.isdigit():
            idx = int(raw) - 1
            if 0 <= idx < len(options):
                return idx
        print(f"  Please enter a number between 1 and {len(options)}.")


def choose_or_cancel(options: List[str], prompt_text: str = "Choose",
                     cancel_label: str = "Cancel") -> Optional[int]:
    """Like choose() but adds a cancel option.  Returns None if cancelled."""
    full_options = options + [cancel_label]
    idx = choose(full_options, prompt_text)
    if idx == len(options):
        return None
    return idx


def press_enter(message: str = "Press ENTER to continue..."):
    input(f"\n  {message}")


def yes_no(question: str) -> bool:
    """Ask a yes/no question and return True for yes."""
    while True:
        ans = input(f"\n  {question} [y/n]: ").strip().lower()
        if ans in ("y", "yes"):
            return True
        if ans in ("n", "no"):
            return False
        print("  Please enter y or n.")
