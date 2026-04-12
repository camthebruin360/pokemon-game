# Pokémon Adventure Game — with Dev Tools

A tile-based Pokémon-style adventure game built with vanilla HTML5 Canvas, CSS, and JavaScript. Features a comprehensive **Dev Mode** with map editing and sprite design tools.

## How to Play

Open `index.html` in any modern web browser. No build step or server required.

### Controls

| Key | Action |
|-----|--------|
| **WASD** / **Arrow Keys** | Move player |
| **Shift+D** | Toggle Dev Mode |
| **Mouse Wheel** | Zoom in/out |
| **🛠 Dev Mode button** | Toggle Dev Mode |

## Dev Mode Features

### 🗺 Map Editor
- **Brush tool** (B) — Paint tiles onto the map with adjustable brush size (1–5)
- **Eraser** (E) — Remove tiles
- **Fill tool** (F) — Flood-fill areas with a selected tile
- **Eyedropper** (I) — Pick a tile from the map
- **Rectangle** (R) — Draw filled rectangles
- **Layer system** — Edit Ground, Objects, and Collision layers independently
- **Tile palette** — 20+ terrain and object tiles (grass, roads, water, trees, buildings, etc.)
- **Grid overlay** and **Collision visualization**
- **Undo/Redo** (Ctrl+Z / Ctrl+Y)
- **Save/Load/Export** maps as JSON

### 🎨 Sprite Designer
- **Pixel art editor** — Design custom 16×16, 32×32, or 64×64 sprites
- **Drawing tools** — Pencil, Eraser, Fill, Line, Mirror mode
- **Full color palette** with color picker
- **Animation frames** — Add multiple frames and preview animation
- **8 preset sprites** — Trainer, Cat, Car, Dragon, Star, House, Tree, Gem
- **Apply to Player** — Use your custom sprite as the player character
- **Export as PNG** or save/load as JSON

### ⚙ World Settings
- **Time of Day** — Slide from midnight to noon with dynamic lighting
- **Weather** — Clear, Rain, Snow, Fog effects
- **Player Speed** — Adjust movement speed
- **Camera Zoom** — 0.5x to 4x zoom
- **Teleport** — Jump to any tile coordinate
- **Debug** — FPS counter, hitbox display, no-clip mode

## Project Structure

```
pokemon-game/
├── index.html              # Main game page
├── css/
│   └── style.css           # All styling
├── js/
│   ├── tiles.js            # Tile definitions and rendering
│   ├── map.js              # Map data structure and rendering
│   ├── player.js           # Player character
│   ├── weather.js          # Weather and time-of-day effects
│   ├── mapEditor.js        # Map editor tools (brush, fill, etc.)
│   ├── spriteDesigner.js   # Pixel art sprite designer
│   ├── devtools.js         # Dev tools panel controller
│   └── game.js             # Main game engine and loop
└── README.md
```

## Technical Details

- Pure vanilla JavaScript — no frameworks or dependencies
- Procedural tile rendering — no external image assets needed
- HTML5 Canvas with smooth camera and zoom
- LocalStorage for saving maps and sprites
- JSON export/import for sharing creations
