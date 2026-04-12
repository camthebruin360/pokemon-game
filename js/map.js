/* ===== map.js — Map Data & Rendering ===== */

class GameMap {
  constructor(width, height) {
    this.width = width || 40;
    this.height = height || 30;
    this.layers = {
      ground: this.createLayer(0),   // default grass
      objects: this.createLayer(-1),  // -1 means empty
      collision: null                 // derived from tiles
    };
    this.generateDefaultMap();
  }

  createLayer(defaultValue) {
    const layer = [];
    for (let y = 0; y < this.height; y++) {
      layer[y] = [];
      for (let x = 0; x < this.width; x++) {
        layer[y][x] = defaultValue;
      }
    }
    return layer;
  }

  generateDefaultMap() {
    // Fill ground with grass
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.layers.ground[y][x] = 0; // grass
      }
    }

    // Add a dirt path
    for (let x = 5; x < this.width - 5; x++) {
      this.setTile('ground', x, 14, 2);
      this.setTile('ground', x, 15, 2);
    }

    // Road with lines
    for (let y = 0; y < this.height; y++) {
      this.setTile('ground', 20, y, 4);
      this.setTile('ground', 21, y, 5);
      this.setTile('ground', 22, y, 4);
    }

    // Water pond
    for (let y = 3; y < 8; y++) {
      for (let x = 30; x < 36; x++) {
        const edge = (y === 3 || y === 7 || x === 30 || x === 35);
        this.setTile('ground', x, y, edge ? 7 : 8);
      }
    }

    // Scatter some trees
    const treePositions = [
      [3, 3], [5, 8], [8, 2], [12, 5], [15, 10], [26, 4], [28, 12],
      [35, 15], [10, 20], [7, 22], [33, 22], [38, 8]
    ];
    for (const [tx, ty] of treePositions) {
      if (tx < this.width && ty < this.height) {
        this.setTile('objects', tx, ty, 20);
      }
    }

    // Some rocks
    this.setTile('objects', 14, 3, 21);
    this.setTile('objects', 25, 18, 21);

    // A small house
    for (let y = 10; y < 13; y++) {
      for (let x = 8; x < 12; x++) {
        if (y === 10) this.setTile('objects', x, y, 26);
        else this.setTile('objects', x, y, 25);
      }
    }
    this.setTile('objects', 9, 12, 27); // door

    // Tall grass areas
    for (let y = 20; y < 26; y++) {
      for (let x = 15; x < 22; x++) {
        if (x === 20 || x === 21 || x === 22) continue; // skip road
        this.setTile('ground', x, y, 1);
      }
    }

    // Flowers
    this.setTile('ground', 6, 14, 11);
    this.setTile('ground', 7, 13, 11);
    this.setTile('ground', 25, 10, 11);
  }

  setTile(layer, x, y, tileId) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.layers[layer][x] = this.layers[layer][x] || [];
      this.layers[layer][y][x] = tileId;
    }
  }

  getTile(layer, x, y) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.layers[layer][y][x];
    }
    return -1;
  }

  isCollision(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return true;

    const groundTile = TILES[this.layers.ground[y][x]];
    if (groundTile && groundTile.collision) return true;

    const objTile = this.layers.objects[y][x];
    if (objTile >= 0) {
      const t = TILES[objTile];
      if (t && t.collision) return true;
    }
    return false;
  }

  render(ctx, camera, zoom) {
    const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
    const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
    const endX = Math.min(this.width, startX + Math.ceil(ctx.canvas.width / (TILE_SIZE * zoom)) + 3);
    const endY = Math.min(this.height, startY + Math.ceil(ctx.canvas.height / (TILE_SIZE * zoom)) + 3);

    // Ground layer
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tileId = this.layers.ground[y][x];
        if (tileId >= 0) {
          drawTile(ctx, x * TILE_SIZE, y * TILE_SIZE, tileId);
        }
      }
    }

    // Objects layer
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tileId = this.layers.objects[y][x];
        if (tileId >= 0) {
          drawTile(ctx, x * TILE_SIZE, y * TILE_SIZE, tileId);
        }
      }
    }
  }

  resize(newWidth, newHeight) {
    const newGround = [];
    const newObjects = [];
    for (let y = 0; y < newHeight; y++) {
      newGround[y] = [];
      newObjects[y] = [];
      for (let x = 0; x < newWidth; x++) {
        newGround[y][x] = (y < this.height && x < this.width) ? this.layers.ground[y][x] : 0;
        newObjects[y][x] = (y < this.height && x < this.width) ? this.layers.objects[y][x] : -1;
      }
    }
    this.width = newWidth;
    this.height = newHeight;
    this.layers.ground = newGround;
    this.layers.objects = newObjects;
  }

  toJSON() {
    return {
      width: this.width,
      height: this.height,
      ground: this.layers.ground,
      objects: this.layers.objects
    };
  }

  static fromJSON(data) {
    const map = new GameMap(data.width, data.height);
    map.layers.ground = data.ground;
    map.layers.objects = data.objects;
    return map;
  }
}
