"""Creature class – the core monster entity."""
from __future__ import annotations

import math
from typing import List, Optional

from game.models.move import Move, STRUGGLE


class Creature:
    """A battle-ready creature with stats, moves, and experience."""

    MAX_MOVES = 4

    def __init__(
        self,
        species_id: str,
        name: str,
        types: List[str],
        base_stats: dict,          # hp, atk, def, spatk, spdef, spd
        level: int,
        move_pool: List[Move],     # moves known by this creature
        base_exp_yield: int,
        evolution_level: Optional[int] = None,
        evolution_id: Optional[str] = None,
    ):
        self.species_id = species_id
        self.name = name
        self.types = types
        self.base_stats = base_stats
        self.level = level
        self.base_exp_yield = base_exp_yield
        self.evolution_level = evolution_level
        self.evolution_id = evolution_id

        # Clip to MAX_MOVES
        self.moves: List[Move] = move_pool[:self.MAX_MOVES]

        # Calculate stats from base
        self.max_hp, self.atk, self.defense, self.spatk, self.spdef, self.spd = (
            self._calc_stats()
        )
        self.current_hp = self.max_hp

        # Experience
        self.experience = self._exp_for_level(self.level)

    # ------------------------------------------------------------------
    # Stat calculation
    # ------------------------------------------------------------------

    def _calc_stat(self, base: int, is_hp: bool = False) -> int:
        """Simplified stat formula based on level & base stat."""
        if is_hp:
            return int((base * 2 * self.level) / 100 + self.level + 10)
        return int((base * 2 * self.level) / 100 + 5)

    def _calc_stats(self):
        bs = self.base_stats
        hp = self._calc_stat(bs["hp"], is_hp=True)
        atk = self._calc_stat(bs["atk"])
        defense = self._calc_stat(bs["def"])
        spatk = self._calc_stat(bs["spatk"])
        spdef = self._calc_stat(bs["spdef"])
        spd = self._calc_stat(bs["spd"])
        return hp, atk, defense, spatk, spdef, spd

    def recalc_stats(self):
        """Recompute all stats (e.g. after levelling up)."""
        old_max = self.max_hp
        self.max_hp, self.atk, self.defense, self.spatk, self.spdef, self.spd = (
            self._calc_stats()
        )
        # Proportionally adjust current HP
        self.current_hp = min(
            self.current_hp + (self.max_hp - old_max), self.max_hp
        )

    # ------------------------------------------------------------------
    # Experience / levelling
    # ------------------------------------------------------------------

    @staticmethod
    def _exp_for_level(lvl: int) -> int:
        """Total experience needed to reach *lvl*."""
        return lvl ** 3

    def gain_exp(self, amount: int) -> List[str]:
        """
        Add experience.  Returns a list of log messages (level-ups, etc.).
        """
        messages = []
        self.experience += amount
        messages.append(f"  {self.name} gained {amount} EXP!")

        while True:
            next_level = self.level + 1
            needed = self._exp_for_level(next_level)
            if self.experience >= needed:
                self.level = next_level
                self.recalc_stats()
                messages.append(f"  {self.name} grew to level {self.level}!")
            else:
                break

        return messages

    def exp_to_next(self) -> int:
        return self._exp_for_level(self.level + 1) - self.experience

    # ------------------------------------------------------------------
    # HP helpers
    # ------------------------------------------------------------------

    @property
    def is_fainted(self) -> bool:
        return self.current_hp <= 0

    def heal(self, amount: int):
        self.current_hp = min(self.max_hp, self.current_hp + amount)

    def full_heal(self):
        self.current_hp = self.max_hp

    def take_damage(self, damage: int):
        self.current_hp = max(0, self.current_hp - damage)

    def revive(self, hp_amount: Optional[int] = None):
        if self.is_fainted:
            self.current_hp = hp_amount if hp_amount else self.max_hp // 2

    # ------------------------------------------------------------------
    # Move helpers
    # ------------------------------------------------------------------

    def get_usable_move(self, index: int) -> Move:
        """Return the chosen move, or Struggle if it has no PP."""
        move = self.moves[index]
        if move.current_pp <= 0:
            return STRUGGLE
        return move

    def has_any_pp(self) -> bool:
        return any(m.current_pp > 0 for m in self.moves)

    def restore_all_pp(self):
        for m in self.moves:
            m.restore_pp()

    def learn_move(self, new_move: Move, replace_index: Optional[int] = None):
        """Add a new move; replace at index or append (max 4)."""
        if replace_index is not None:
            self.moves[replace_index] = new_move
        elif len(self.moves) < self.MAX_MOVES:
            self.moves.append(new_move)

    # ------------------------------------------------------------------
    # Serialisation
    # ------------------------------------------------------------------

    def to_dict(self) -> dict:
        return {
            "species_id": self.species_id,
            "name": self.name,
            "types": self.types,
            "base_stats": self.base_stats,
            "level": self.level,
            "experience": self.experience,
            "current_hp": self.current_hp,
            "base_exp_yield": self.base_exp_yield,
            "evolution_level": self.evolution_level,
            "evolution_id": self.evolution_id,
            "moves": [m.to_dict() for m in self.moves],
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Creature":
        from game.data.moves import MOVE_DB
        moves = [Move.from_dict(m) for m in d["moves"]]
        c = cls(
            species_id=d["species_id"],
            name=d["name"],
            types=d["types"],
            base_stats=d["base_stats"],
            level=d["level"],
            move_pool=moves,
            base_exp_yield=d["base_exp_yield"],
            evolution_level=d.get("evolution_level"),
            evolution_id=d.get("evolution_id"),
        )
        c.experience = d.get("experience", c._exp_for_level(c.level))
        c.current_hp = d.get("current_hp", c.max_hp)
        return c

    # ------------------------------------------------------------------
    # Display
    # ------------------------------------------------------------------

    def hp_bar(self, width: int = 20) -> str:
        ratio = self.current_hp / self.max_hp if self.max_hp else 0
        filled = int(ratio * width)
        bar = "█" * filled + "░" * (width - filled)
        return f"[{bar}] {self.current_hp}/{self.max_hp}"

    def __str__(self):
        types_str = "/".join(self.types)
        return (
            f"{self.name} (Lv.{self.level} {types_str}) "
            f"HP:{self.current_hp}/{self.max_hp}"
        )
