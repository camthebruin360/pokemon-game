"""Turn-based battle engine (wild & trainer battles)."""
from __future__ import annotations

import random
import math
from enum import Enum, auto
from typing import List, Optional, TYPE_CHECKING

from game.models.move import Move, STRUGGLE
from game.models.type_chart import get_effectiveness, effectiveness_label

if TYPE_CHECKING:
    from game.models.creature import Creature
    from game.models.player import Player


class BattleResult(Enum):
    PLAYER_WIN  = auto()
    PLAYER_LOSE = auto()
    ESCAPED     = auto()
    CAPTURED    = auto()


# ---------------------------------------------------------------------------
# Damage calculation
# ---------------------------------------------------------------------------

def _calc_damage(attacker: "Creature", defender: "Creature", move: Move) -> tuple:
    """
    Returns (damage, effectiveness_multiplier, is_critical).
    """
    if move.power == 0:
        return 0, 1.0, False

    # Physical vs Special
    if move.category == "physical":
        atk = attacker.atk
        def_ = defender.defense
    else:
        atk = attacker.spatk
        def_ = defender.spdef

    # Core damage formula (Pokémon-style)
    base = ((2 * attacker.level / 5 + 2) * move.power * atk / def_) / 50 + 2

    # Critical hit (6.25%)
    is_crit = random.random() < 0.0625
    crit_mult = 1.5 if is_crit else 1.0

    # Type effectiveness
    effectiveness = get_effectiveness(move.move_type, defender.types)

    # Random variance (0.85 – 1.00)
    variance = random.uniform(0.85, 1.0)

    damage = int(base * crit_mult * effectiveness * variance)
    damage = max(1, damage) if effectiveness > 0 else 0
    return damage, effectiveness, is_crit


# ---------------------------------------------------------------------------
# Capture calculation
# ---------------------------------------------------------------------------

def _capture_chance(wild: "Creature", catch_rate_multiplier: float) -> float:
    """
    Returns probability (0.0–1.0) of capturing the creature.
    Lower HP = higher chance.
    """
    hp_ratio = wild.current_hp / wild.max_hp
    # Base: 30% at full HP, rising to 90% at 1 HP
    base = 0.30 + (1 - hp_ratio) * 0.60
    return min(0.95, base * catch_rate_multiplier)


# ---------------------------------------------------------------------------
# Battle class
# ---------------------------------------------------------------------------

class Battle:
    def __init__(self, player: "Player", wild: "Creature", is_wild: bool = True):
        self.player = player
        self.wild = wild
        self.is_wild = is_wild
        self.log: List[str] = []
        self.result: Optional[BattleResult] = None
        self._active_creature: "Creature" = player.first_alive()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @property
    def active(self) -> "Creature":
        return self._active_creature

    def player_fight(self, move_index: int) -> List[str]:
        """Player uses a move.  Returns turn log."""
        if not self.active.has_any_pp():
            move = STRUGGLE
        else:
            m = self.active.moves[move_index]
            move = STRUGGLE if not m.use() else m

        msgs = []
        if move is STRUGGLE:
            msgs.append(f"{self.active.name} has no PP left and uses Struggle!")

        # Determine turn order
        if self.active.spd >= self.wild.spd:
            msgs += self._player_turn(move)
            if not self.wild.is_fainted and self.result is None:
                msgs += self._wild_turn()
        else:
            msgs += self._wild_turn()
            if not self.active.is_fainted and self.result is None:
                msgs += self._player_turn(move)

        msgs += self._check_state()
        return msgs

    def player_use_item(self, item_id: str, creature_index: int) -> List[str]:
        """Player uses an item during battle."""
        from game.systems.inventory import use_item_on_creature
        from game.models.item import CaptureDevice

        item = self.player.get_item(item_id)
        if item is None:
            return ["You don't have that item!"]

        if isinstance(item, CaptureDevice):
            return self._attempt_capture(item)

        target = self.player.party[creature_index]
        msg = use_item_on_creature(self.player, item_id, target)
        msgs = [msg]
        # Wild creature still gets to attack
        msgs += self._wild_turn()
        msgs += self._check_state()
        return msgs

    def player_switch(self, party_index: int) -> List[str]:
        """Player switches their active creature."""
        new_creature = self.player.party[party_index]
        if new_creature.is_fainted:
            return [f"{new_creature.name} has fainted and can't battle!"]
        if new_creature is self._active_creature:
            return [f"{new_creature.name} is already in battle!"]

        self._active_creature = new_creature
        msgs = [f"Go, {new_creature.name}!"]
        # Wild gets a free attack after switch
        msgs += self._wild_turn()
        msgs += self._check_state()
        return msgs

    def player_run(self) -> List[str]:
        """Attempt to flee the battle (wild only)."""
        if not self.is_wild:
            return ["You can't run from a trainer battle!"]
        # Speed-based escape chance
        escape_chance = 0.5 + (self.active.spd - self.wild.spd) / 200
        escape_chance = max(0.2, min(0.9, escape_chance))
        if random.random() < escape_chance:
            self.result = BattleResult.ESCAPED
            return ["You got away safely!"]
        msgs = ["Couldn't escape!"]
        msgs += self._wild_turn()
        msgs += self._check_state()
        return msgs

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _player_turn(self, move: Move) -> List[str]:
        msgs = [f"{self.active.name} used {move.name}!"]
        if random.randint(1, 100) > move.accuracy:
            msgs.append("  The move missed!")
            return msgs
        dmg, eff, crit = _calc_damage(self.active, self.wild, move)
        label = effectiveness_label(eff)
        if crit:
            msgs.append("  A critical hit!")
        if label:
            msgs.append(f"  {label}")
        self.wild.take_damage(dmg)
        msgs.append(f"  {self.wild.name} took {dmg} damage! ({self.wild.current_hp}/{self.wild.max_hp} HP)")
        return msgs

    def _wild_turn(self) -> List[str]:
        if self.wild.is_fainted:
            return []
        # Wild picks a random usable move (or Struggle)
        usable = [m for m in self.wild.moves if m.current_pp > 0]
        if usable:
            move = random.choice(usable)
            move.use()
        else:
            move = STRUGGLE

        msgs = [f"Wild {self.wild.name} used {move.name}!"]
        if random.randint(1, 100) > move.accuracy:
            msgs.append("  The wild creature's move missed!")
            return msgs

        dmg, eff, crit = _calc_damage(self.wild, self.active, move)
        label = effectiveness_label(eff)
        if crit:
            msgs.append("  A critical hit!")
        if label:
            msgs.append(f"  {label}")
        self.active.take_damage(dmg)
        msgs.append(
            f"  {self.active.name} took {dmg} damage! "
            f"({self.active.current_hp}/{self.active.max_hp} HP)"
        )
        return msgs

    def _attempt_capture(self, device) -> List[str]:
        from game.models.item import CaptureDevice
        if not self.is_wild:
            return ["You can't capture trainer's creatures!"]
        if not isinstance(device, CaptureDevice):
            return ["That isn't a capture device!"]

        self.player.remove_item(device.item_id)
        chance = _capture_chance(self.wild, device.catch_rate)
        msgs = [f"You threw a {device.name}!"]
        shakes = 0
        for i in range(3):
            if random.random() < chance ** (1 / 3):
                shakes += 1
                msgs.append("  *shake*")
            else:
                break
        if shakes == 3:
            self.result = BattleResult.CAPTURED
            msgs.append(f"  {self.wild.name} was caught!")
        else:
            msgs.append(f"  {self.wild.name} broke free!")
            msgs += self._wild_turn()
            msgs += self._check_state()
        return msgs

    def _check_state(self) -> List[str]:
        msgs = []
        if self.result is not None:
            return msgs  # already resolved

        if self.wild.is_fainted:
            msgs.append(f"Wild {self.wild.name} fainted!")
            self.result = BattleResult.PLAYER_WIN
            # Award experience
            from game.systems.experience import exp_gained, apply_exp, moves_to_learn
            from game.systems.evolution import check_evolution, evolve
            exp = exp_gained(self.wild)
            level_msgs = apply_exp(self.active, exp)
            msgs += level_msgs
            # Check for new moves to learn
            new_move_names = moves_to_learn(self.active)
            if new_move_names:
                msgs.append(f"  {self.active.name} can learn new moves: {', '.join(new_move_names)}")
            # Check evolution
            evo_id = check_evolution(self.active)
            if evo_id:
                from game.data.creatures import CREATURE_TEMPLATES
                old_name = self.active.name
                evolve(self.active)
                msgs.append(f"  ✨ {old_name} is evolving into {self.active.name}! ✨")
            return msgs

        if self.active.is_fainted:
            msgs.append(f"{self.active.name} fainted!")
            # Try to find next alive creature
            next_creature = None
            for c in self.player.party:
                if not c.is_fainted and c is not self.active:
                    next_creature = c
                    break
            if next_creature:
                self._active_creature = next_creature
                msgs.append(f"Go, {next_creature.name}!")
            else:
                self.result = BattleResult.PLAYER_LOSE
                msgs.append("All your creatures have fainted! You blacked out...")

        return msgs
