# CreatureQuest 🎮

A Pokémon-style monster collecting and battling game written in Python.  
Fully playable in the terminal — no extra dependencies required!

---

## How to Play

```bash
python game/main.py
```

> Requires **Python 3.9+**.  No external packages needed.

---

## Game Features

| Feature | Details |
|---|---|
| 🐾 **Creatures** | 18 unique monsters with stats, types & evolutions |
| ⚔️ **Battle System** | Turn-based with type effectiveness, crits, damage formula |
| 🔥 **8 Types** | Normal, Fire, Water, Grass, Electric, Ice, Fighting, Psychic |
| 📈 **Leveling** | Exp gain, stat growth, new move learning on level-up |
| 🧬 **Evolution** | Level-based evolution (2–3 stage chains) |
| 🎒 **Inventory** | Potions, capture devices, revives |
| 🌍 **Exploration** | 8 areas with unique encounter tables |
| 💾 **Save/Load** | JSON-based save system |
| 🎮 **Starter Pick** | Choose from Fire, Water, or Grass starter |

---

## Controls

All input is number-based — just type the number shown in `[brackets]` and press Enter.

### Main Menu Options
| Option | Description |
|---|---|
| **Explore** | Move between areas and search for wild creatures |
| **View Party** | See your creatures' stats and moves |
| **View Inventory** | Use items outside of battle |
| **Heal Party** | Fully restore all creatures at a rest stop |
| **Save Game** | Save your progress to `savegame.json` |
| **Quit** | Exit the game (with optional save) |

### In Battle
| Option | Description |
|---|---|
| **Fight** | Choose one of up to 4 moves to attack |
| **Item** | Use a potion, revive, or throw a Capture Sphere |
| **Switch** | Swap your active creature |
| **Run** | Flee from wild encounters (speed-dependent) |

---

## Starter Creatures

| Name | Type | Evolution Chain |
|---|---|---|
| **Emberpup** | Fire | Emberpup → Blazehound (Lv.16) → Infernowolf (Lv.36) |
| **Splashlet** | Water | Splashlet → Tidecrest (Lv.16) → Tsunamaw (Lv.36) |
| **Sproutling** | Grass | Sproutling → Thornvine (Lv.16) → Forestitan (Lv.36) |

---

## Areas

| Area | Notable Creatures |
|---|---|
| Verdant Trail | Sproutling, Swiftail, Emberpup, Splashlet |
| Rocky Path | Rockbiter, Punchkin, Swiftail |
| Ember Caves | Emberpup, Blazehound, Zappeling |
| Crystal Lake | Splashlet, Tidecrest, Frostbite |
| Frozen Peaks | Frostbite, Glacihorn, Zappeling |
| Thunder Plains | Zappeling, Voltmane, Swiftail |
| Psychic Grove | Psywisp, Mentarex, Glacihorn, Brutalux |

---

## Folder Structure

```
game/
├── main.py              # Entry point & game loop
├── models/
│   ├── creature.py      # Creature class
│   ├── move.py          # Move class
│   ├── item.py          # Item classes
│   ├── player.py        # Player class
│   └── type_chart.py    # Type effectiveness
├── systems/
│   ├── battle.py        # Battle engine
│   ├── encounter.py     # Wild encounter system
│   ├── evolution.py     # Evolution system
│   ├── experience.py    # EXP & leveling
│   └── inventory.py     # Inventory management
├── data/
│   ├── creatures.py     # Creature database (18 creatures)
│   ├── moves.py         # Move database (40+ moves)
│   ├── items.py         # Item database
│   └── areas.py         # Area & encounter tables
└── utils/
    └── helpers.py       # Display & input utilities
```

---

## Tips

- Visit the **Rest Stop** from the main menu to fully heal your party for free.
- Use **Capture Spheres** in battle when the wild creature is low on HP for best results.
- Creatures learn new moves automatically on level-up (you can choose to replace an old move if you already know 4).
- Each type has strengths and weaknesses — pay attention to the effectiveness messages!
