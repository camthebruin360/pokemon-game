/* ===== tiles.js — Tile Definitions ===== */

const TILE_SIZE = 16;

/**
 * Each tile has an id, name, color pattern, and collision flag.
 * Colors are drawn procedurally so we don't need external assets.
 */
const TILES = {
  // Ground tiles
  0:  { id: 0,  name: 'Grass',       category: 'ground', collision: false, colors: ['#4a8c38', '#3d7a2e', '#55a040'] },
  1:  { id: 1,  name: 'Tall Grass',  category: 'ground', collision: false, colors: ['#3d7a2e', '#2d6a1e', '#4a8c38'], detail: 'tallgrass' },
  2:  { id: 2,  name: 'Dirt Path',   category: 'ground', collision: false, colors: ['#8B7355', '#7a6248', '#9c8462'] },
  3:  { id: 3,  name: 'Sand',        category: 'ground', collision: false, colors: ['#dcc282', '#c4a96e', '#e8d49a'] },
  4:  { id: 4,  name: 'Road',        category: 'ground', collision: false, colors: ['#555555', '#4a4a4a', '#666666'] },
  5:  { id: 5,  name: 'Road Line',   category: 'ground', collision: false, colors: ['#555555', '#4a4a4a', '#666666'], detail: 'roadline' },
  6:  { id: 6,  name: 'Sidewalk',    category: 'ground', collision: false, colors: ['#aaaaaa', '#999999', '#bbbbbb'] },
  7:  { id: 7,  name: 'Water',       category: 'ground', collision: true,  colors: ['#2980b9', '#2471a3', '#3498db'], detail: 'water' },
  8:  { id: 8,  name: 'Deep Water',  category: 'ground', collision: true,  colors: ['#1a5276', '#154360', '#1f6f8b'] },
  9:  { id: 9,  name: 'Stone Floor', category: 'ground', collision: false, colors: ['#7f8c8d', '#6d7b7c', '#95a5a6'] },
  10: { id: 10, name: 'Wood Floor',  category: 'ground', collision: false, colors: ['#a0522d', '#8b4513', '#b8651a'] },
  11: { id: 11, name: 'Flowers',     category: 'ground', collision: false, colors: ['#4a8c38', '#3d7a2e', '#55a040'], detail: 'flowers' },
  12: { id: 12, name: 'Dark Grass',  category: 'ground', collision: false, colors: ['#2d6a1e', '#1e5a0f', '#3d7a2e'] },

  // Object tiles
  20: { id: 20, name: 'Tree',        category: 'objects', collision: true,  colors: ['#2d6a1e', '#1e5a0f', '#4a2810'], detail: 'tree' },
  21: { id: 21, name: 'Rock',        category: 'objects', collision: true,  colors: ['#7f8c8d', '#6d7b7c', '#95a5a6'], detail: 'rock' },
  22: { id: 22, name: 'Bush',        category: 'objects', collision: true,  colors: ['#27ae60', '#1e8449', '#2ecc71'], detail: 'bush' },
  23: { id: 23, name: 'Fence H',     category: 'objects', collision: true,  colors: ['#8B6914', '#7a5a0a', '#9c7a24'], detail: 'fence_h' },
  24: { id: 24, name: 'Fence V',     category: 'objects', collision: true,  colors: ['#8B6914', '#7a5a0a', '#9c7a24'], detail: 'fence_v' },
  25: { id: 25, name: 'House Wall',  category: 'objects', collision: true,  colors: ['#c0392b', '#a93226', '#e74c3c'], detail: 'house' },
  26: { id: 26, name: 'Roof',        category: 'objects', collision: true,  colors: ['#6c3483', '#5b2c6f', '#7d3c98'] },
  27: { id: 27, name: 'Door',        category: 'objects', collision: false, colors: ['#8B6914', '#7a5a0a', '#9c7a24'], detail: 'door' },
  28: { id: 28, name: 'Sign',        category: 'objects', collision: true,  colors: ['#8B6914', '#7a5a0a', '#f4d03f'], detail: 'sign' },
  29: { id: 29, name: 'Street Light', category: 'objects', collision: true, colors: ['#555', '#777', '#ff0'], detail: 'streetlight' },
  30: { id: 30, name: 'Bench',       category: 'objects', collision: true,  colors: ['#8B6914', '#555', '#aaa'], detail: 'bench' },
};

/**
 * Render a tile to a small canvas (for palette display or caching).
 */
function renderTileToCanvas(tileId, size) {
  size = size || TILE_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  drawTile(ctx, 0, 0, tileId, size);
  return canvas;
}

/**
 * Draw a single tile at the given position.
 */
function drawTile(ctx, x, y, tileId, size) {
  size = size || TILE_SIZE;
  const tile = TILES[tileId];
  if (!tile) return;

  // Base color
  ctx.fillStyle = tile.colors[0];
  ctx.fillRect(x, y, size, size);

  // Noise / texture
  const s = size / TILE_SIZE;
  for (let i = 0; i < 6; i++) {
    const nx = x + ((tileId * 7 + i * 13) % (size - 2));
    const ny = y + ((tileId * 11 + i * 17) % (size - 2));
    ctx.fillStyle = tile.colors[(i % 2) + 1];
    ctx.fillRect(nx, ny, 2 * s, 2 * s);
  }

  // Detail overlays
  if (tile.detail) {
    drawTileDetail(ctx, x, y, size, tile.detail, tile.colors);
  }
}

function drawTileDetail(ctx, x, y, size, detail, colors) {
  const s = size / TILE_SIZE;
  const cx = x + size / 2;
  const cy = y + size / 2;

  switch (detail) {
    case 'tallgrass':
      ctx.strokeStyle = '#2d6a1e';
      ctx.lineWidth = s;
      for (let i = 0; i < 5; i++) {
        const bx = x + 2 * s + i * 3 * s;
        ctx.beginPath();
        ctx.moveTo(bx, y + size);
        ctx.lineTo(bx + s, y + 4 * s);
        ctx.stroke();
      }
      break;

    case 'water':
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = s;
      ctx.beginPath();
      ctx.moveTo(x + 2 * s, cy);
      ctx.quadraticCurveTo(cx, cy - 3 * s, x + size - 2 * s, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 3 * s, cy + 4 * s);
      ctx.quadraticCurveTo(cx + 2 * s, cy + s, x + size - 3 * s, cy + 4 * s);
      ctx.stroke();
      break;

    case 'roadline':
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = s;
      ctx.setLineDash([4 * s, 4 * s]);
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(cx, y + size);
      ctx.stroke();
      ctx.setLineDash([]);
      break;

    case 'tree':
      // trunk
      ctx.fillStyle = colors[2];
      ctx.fillRect(cx - 2 * s, cy + 2 * s, 4 * s, 6 * s);
      // foliage
      ctx.fillStyle = colors[0];
      ctx.beginPath();
      ctx.arc(cx, cy - s, 6 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors[1];
      ctx.beginPath();
      ctx.arc(cx - 2 * s, cy, 4 * s, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'rock':
      ctx.fillStyle = colors[2];
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2 * s, 6 * s, 4 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors[0];
      ctx.beginPath();
      ctx.ellipse(cx, cy, 5 * s, 3.5 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'bush':
      ctx.fillStyle = colors[0];
      ctx.beginPath();
      ctx.arc(cx, cy, 6 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors[2];
      ctx.beginPath();
      ctx.arc(cx - 2 * s, cy - s, 3 * s, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'fence_h':
      ctx.fillStyle = colors[0];
      ctx.fillRect(x, cy - s, size, 2 * s);
      ctx.fillRect(x + 2 * s, cy - 4 * s, 2 * s, 8 * s);
      ctx.fillRect(x + size - 4 * s, cy - 4 * s, 2 * s, 8 * s);
      break;

    case 'fence_v':
      ctx.fillStyle = colors[0];
      ctx.fillRect(cx - s, y, 2 * s, size);
      ctx.fillRect(cx - 4 * s, y + 2 * s, 8 * s, 2 * s);
      ctx.fillRect(cx - 4 * s, y + size - 4 * s, 8 * s, 2 * s);
      break;

    case 'house':
      ctx.fillStyle = colors[2];
      ctx.fillRect(x + s, y + s, size - 2 * s, size - 2 * s);
      ctx.fillStyle = '#bbb';
      ctx.fillRect(x + 3 * s, y + 3 * s, 4 * s, 4 * s);
      ctx.fillRect(x + 9 * s, y + 3 * s, 4 * s, 4 * s);
      break;

    case 'door':
      ctx.fillStyle = colors[0];
      ctx.fillRect(x + 3 * s, y + 2 * s, 10 * s, size - 2 * s);
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(x + 11 * s, cy + 2 * s, 1.5 * s, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'sign':
      ctx.fillStyle = colors[0];
      ctx.fillRect(cx - s, cy, 2 * s, size / 2);
      ctx.fillStyle = colors[2];
      ctx.fillRect(x + 2 * s, y + 2 * s, size - 4 * s, size / 2 - s);
      break;

    case 'flowers':
      const flowerColors = ['#e74c3c', '#f1c40f', '#e67e22', '#9b59b6', '#3498db'];
      for (let i = 0; i < 5; i++) {
        const fx = x + ((i * 7 + 3) % (size - 4));
        const fy = y + ((i * 11 + 5) % (size - 4));
        ctx.fillStyle = flowerColors[i % flowerColors.length];
        ctx.beginPath();
        ctx.arc(fx + 2, fy + 2, 1.5 * s, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 'streetlight':
      ctx.fillStyle = colors[0];
      ctx.fillRect(cx - s, cy - 2 * s, 2 * s, size / 2 + 4 * s);
      ctx.fillStyle = colors[1];
      ctx.fillRect(cx - 3 * s, y + s, 6 * s, 3 * s);
      ctx.fillStyle = colors[2];
      ctx.fillRect(cx - 2 * s, y + 2 * s, 4 * s, 1 * s);
      break;

    case 'bench':
      ctx.fillStyle = colors[0];
      ctx.fillRect(x + 2 * s, cy, size - 4 * s, 3 * s);
      ctx.fillStyle = colors[1];
      ctx.fillRect(x + 3 * s, cy + 3 * s, 2 * s, 4 * s);
      ctx.fillRect(x + size - 5 * s, cy + 3 * s, 2 * s, 4 * s);
      ctx.fillStyle = colors[0];
      ctx.fillRect(x + 2 * s, cy - 4 * s, size - 4 * s, 2 * s);
      break;
  }
}
