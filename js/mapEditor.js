/* ===== mapEditor.js — Map Editor Tools ===== */

class MapEditor {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.currentTool = 'brush';
    this.currentTile = 0;
    this.currentLayer = 'ground';
    this.brushSize = 1;
    this.showGrid = true;
    this.showCollision = false;

    // Undo/Redo stacks
    this.undoStack = [];
    this.redoStack = [];
    this.currentAction = null;

    // Rectangle tool state
    this.rectStart = null;
    this.isDrawing = false;

    this.init();
  }

  init() {
    this.buildTilePalette();
    this.bindEvents();
  }

  buildTilePalette() {
    const palette = document.getElementById('tile-palette');
    if (!palette) return;
    palette.innerHTML = '';

    const tileIds = Object.keys(TILES).map(Number).sort((a, b) => a - b);
    for (const id of tileIds) {
      const tile = TILES[id];
      const swatch = document.createElement('div');
      swatch.className = 'tile-swatch' + (id === this.currentTile ? ' active' : '');
      swatch.dataset.tileId = id;

      const tileCanvas = renderTileToCanvas(id, 32);
      swatch.appendChild(tileCanvas);

      const label = document.createElement('div');
      label.className = 'tile-label';
      label.textContent = tile.name;
      swatch.appendChild(label);

      swatch.addEventListener('click', () => {
        document.querySelectorAll('.tile-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.currentTile = id;
      });

      palette.appendChild(swatch);
    }
  }

  bindEvents() {
    // Tool buttons
    document.querySelectorAll('.map-tool').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.map-tool').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTool = btn.dataset.tool;
      });
    });

    // Layer buttons
    document.querySelectorAll('.layer-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentLayer = btn.dataset.layer;
      });
    });

    // Brush size
    const brushSize = document.getElementById('brush-size');
    const brushLabel = document.getElementById('brush-size-label');
    if (brushSize) {
      brushSize.addEventListener('input', () => {
        this.brushSize = parseInt(brushSize.value);
        brushLabel.textContent = this.brushSize;
      });
    }

    // Grid & collision toggles
    const showGrid = document.getElementById('show-grid');
    const showCollision = document.getElementById('show-collision');
    if (showGrid) showGrid.addEventListener('change', () => { this.showGrid = showGrid.checked; });
    if (showCollision) showCollision.addEventListener('change', () => { this.showCollision = showCollision.checked; });

    // Action buttons
    this.bindAction('map-new', () => this.newMap());
    this.bindAction('map-resize', () => this.resizeMap());
    this.bindAction('map-clear', () => this.clearLayer());
    this.bindAction('map-save', () => this.saveMap());
    this.bindAction('map-load', () => document.getElementById('map-file-input').click());
    this.bindAction('map-export', () => this.exportMap());
    this.bindAction('map-undo', () => this.undo());
    this.bindAction('map-redo', () => this.redo());

    // File input for load
    const fileInput = document.getElementById('map-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.loadMapFile(e));
    }
  }

  bindAction(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
  }

  // === Canvas interaction ===

  onCanvasMouseDown(worldX, worldY) {
    if (!this.active) return;
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);

    this.isDrawing = true;
    this.currentAction = { layer: this.currentLayer, changes: [] };

    if (this.currentTool === 'rectangle') {
      this.rectStart = { x: tileX, y: tileY };
    } else if (this.currentTool === 'fill') {
      this.floodFill(tileX, tileY);
      this.finishAction();
    } else if (this.currentTool === 'eyedropper') {
      this.eyedrop(tileX, tileY);
    } else {
      this.paint(tileX, tileY);
    }
  }

  onCanvasMouseMove(worldX, worldY) {
    if (!this.active || !this.isDrawing) return;
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);

    if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
      this.paint(tileX, tileY);
    }
  }

  onCanvasMouseUp(worldX, worldY) {
    if (!this.active) return;

    if (this.currentTool === 'rectangle' && this.rectStart) {
      const tileX = Math.floor(worldX / TILE_SIZE);
      const tileY = Math.floor(worldY / TILE_SIZE);
      this.paintRectangle(this.rectStart.x, this.rectStart.y, tileX, tileY);
      this.rectStart = null;
    }

    this.isDrawing = false;
    this.finishAction();
  }

  // === Painting ===

  paint(cx, cy) {
    const map = this.game.map;
    const layer = this.currentLayer === 'collision' ? 'objects' : this.currentLayer;
    const half = Math.floor(this.brushSize / 2);

    for (let dy = -half; dy <= half; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || x >= map.width || y < 0 || y >= map.height) continue;

        const oldTile = map.getTile(layer, x, y);
        const newTile = this.currentTool === 'eraser'
          ? (layer === 'objects' ? -1 : 0)
          : this.currentTile;

        if (oldTile !== newTile) {
          this.recordChange(layer, x, y, oldTile, newTile);
          map.setTile(layer, x, y, newTile);
        }
      }
    }
  }

  paintRectangle(x1, y1, x2, y2) {
    const map = this.game.map;
    const layer = this.currentLayer === 'collision' ? 'objects' : this.currentLayer;
    const minX = Math.max(0, Math.min(x1, x2));
    const maxX = Math.min(map.width - 1, Math.max(x1, x2));
    const minY = Math.max(0, Math.min(y1, y2));
    const maxY = Math.min(map.height - 1, Math.max(y1, y2));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const oldTile = map.getTile(layer, x, y);
        const newTile = this.currentTool === 'eraser' ? (layer === 'objects' ? -1 : 0) : this.currentTile;
        if (oldTile !== newTile) {
          this.recordChange(layer, x, y, oldTile, newTile);
          map.setTile(layer, x, y, newTile);
        }
      }
    }
  }

  floodFill(startX, startY) {
    const map = this.game.map;
    const layer = this.currentLayer === 'collision' ? 'objects' : this.currentLayer;
    const targetTile = map.getTile(layer, startX, startY);
    const fillTile = this.currentTile;

    if (targetTile === fillTile) return;

    const stack = [[startX, startY]];
    const visited = new Set();

    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      if (x < 0 || x >= map.width || y < 0 || y >= map.height) continue;
      if (map.getTile(layer, x, y) !== targetTile) continue;

      visited.add(key);
      this.recordChange(layer, x, y, targetTile, fillTile);
      map.setTile(layer, x, y, fillTile);

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }

  eyedrop(x, y) {
    const map = this.game.map;
    const layer = this.currentLayer === 'collision' ? 'objects' : this.currentLayer;
    const tileId = map.getTile(layer, x, y);
    if (tileId >= 0) {
      this.currentTile = tileId;
      // Update palette UI
      document.querySelectorAll('.tile-swatch').forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.tileId) === tileId);
      });
      this.game.showToast(`Picked: ${TILES[tileId]?.name || 'Unknown'}`);
    }
  }

  // === Undo/Redo ===

  recordChange(layer, x, y, oldTile, newTile) {
    if (this.currentAction) {
      this.currentAction.changes.push({ layer, x, y, oldTile, newTile });
    }
  }

  finishAction() {
    if (this.currentAction && this.currentAction.changes.length > 0) {
      this.undoStack.push(this.currentAction);
      this.redoStack = [];
      if (this.undoStack.length > 100) this.undoStack.shift();
    }
    this.currentAction = null;
  }

  undo() {
    const action = this.undoStack.pop();
    if (!action) return;

    for (const c of action.changes) {
      this.game.map.setTile(c.layer, c.x, c.y, c.oldTile);
    }
    this.redoStack.push(action);
    this.game.showToast('Undo');
  }

  redo() {
    const action = this.redoStack.pop();
    if (!action) return;

    for (const c of action.changes) {
      this.game.map.setTile(c.layer, c.x, c.y, c.newTile);
    }
    this.undoStack.push(action);
    this.game.showToast('Redo');
  }

  // === Map actions ===

  newMap() {
    const w = parseInt(prompt('Map width (tiles):', '40'));
    const h = parseInt(prompt('Map height (tiles):', '30'));
    if (isNaN(w) || isNaN(h) || w < 5 || h < 5) return;
    this.game.map = new GameMap(w, h);
    // Fill with grass
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        this.game.map.setTile('ground', x, y, 0);
    this.undoStack = [];
    this.redoStack = [];
    this.game.showToast(`New map: ${w}×${h}`);
  }

  resizeMap() {
    const w = parseInt(prompt('New width:', this.game.map.width));
    const h = parseInt(prompt('New height:', this.game.map.height));
    if (isNaN(w) || isNaN(h) || w < 5 || h < 5) return;
    this.game.map.resize(w, h);
    this.game.showToast(`Resized to: ${w}×${h}`);
  }

  clearLayer() {
    const layer = this.currentLayer === 'collision' ? 'objects' : this.currentLayer;
    const defaultTile = layer === 'objects' ? -1 : 0;
    const map = this.game.map;
    this.currentAction = { layer, changes: [] };
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const old = map.getTile(layer, x, y);
        if (old !== defaultTile) {
          this.recordChange(layer, x, y, old, defaultTile);
          map.setTile(layer, x, y, defaultTile);
        }
      }
    }
    this.finishAction();
    this.game.showToast(`Cleared ${this.currentLayer} layer`);
  }

  saveMap() {
    const data = JSON.stringify(this.game.map.toJSON());
    localStorage.setItem('pokemon-game-map', data);
    this.game.showToast('Map saved to browser storage');
  }

  loadMapFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        this.game.map = GameMap.fromJSON(data);
        this.undoStack = [];
        this.redoStack = [];
        this.game.showToast('Map loaded!');
      } catch (err) {
        this.game.showToast('Error loading map file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  exportMap() {
    const data = JSON.stringify(this.game.map.toJSON(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pokemon-map.json';
    a.click();
    URL.revokeObjectURL(url);
    this.game.showToast('Map exported as JSON');
  }

  // === Grid & Collision rendering ===

  renderOverlays(ctx, camera, zoom) {
    if (!this.active) return;

    const map = this.game.map;
    const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
    const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
    const endX = Math.min(map.width, startX + Math.ceil(ctx.canvas.width / (TILE_SIZE * zoom)) + 3);
    const endY = Math.min(map.height, startY + Math.ceil(ctx.canvas.height / (TILE_SIZE * zoom)) + 3);

    if (this.showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 0.5;
      for (let x = startX; x <= endX; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE_SIZE, startY * TILE_SIZE);
        ctx.lineTo(x * TILE_SIZE, endY * TILE_SIZE);
        ctx.stroke();
      }
      for (let y = startY; y <= endY; y++) {
        ctx.beginPath();
        ctx.moveTo(startX * TILE_SIZE, y * TILE_SIZE);
        ctx.lineTo(endX * TILE_SIZE, y * TILE_SIZE);
        ctx.stroke();
      }
    }

    if (this.showCollision) {
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          if (map.isCollision(x, y)) {
            ctx.fillStyle = 'rgba(255,0,0,0.25)';
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = 'rgba(255,0,0,0.5)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }

    // Rectangle preview
    if (this.currentTool === 'rectangle' && this.rectStart && this.isDrawing) {
      const mouse = this.game.getMouseWorldPos();
      if (mouse) {
        const mx = Math.floor(mouse.x / TILE_SIZE);
        const my = Math.floor(mouse.y / TILE_SIZE);
        const minX = Math.min(this.rectStart.x, mx);
        const maxX = Math.max(this.rectStart.x, mx);
        const minY = Math.min(this.rectStart.y, my);
        const maxY = Math.max(this.rectStart.y, my);
        ctx.strokeStyle = 'rgba(255,215,0,0.8)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(
          minX * TILE_SIZE, minY * TILE_SIZE,
          (maxX - minX + 1) * TILE_SIZE, (maxY - minY + 1) * TILE_SIZE
        );
        ctx.setLineDash([]);
      }
    }

    // Brush preview
    if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
      const mouse = this.game.getMouseWorldPos();
      if (mouse) {
        const mx = Math.floor(mouse.x / TILE_SIZE);
        const my = Math.floor(mouse.y / TILE_SIZE);
        const half = Math.floor(this.brushSize / 2);
        ctx.strokeStyle = 'rgba(255,215,0,0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(
          (mx - half) * TILE_SIZE, (my - half) * TILE_SIZE,
          this.brushSize * TILE_SIZE, this.brushSize * TILE_SIZE
        );
      }
    }
  }

  // === Keyboard shortcuts ===
  handleKey(key) {
    if (!this.active) return false;

    switch (key.toLowerCase()) {
      case 'b': this.selectTool('brush'); return true;
      case 'e': this.selectTool('eraser'); return true;
      case 'f': this.selectTool('fill'); return true;
      case 'i': this.selectTool('eyedropper'); return true;
      case 'r': this.selectTool('rectangle'); return true;
      case 'z':
        if (this.game.keys['Control']) { this.undo(); return true; }
        break;
      case 'y':
        if (this.game.keys['Control']) { this.redo(); return true; }
        break;
    }
    return false;
  }

  selectTool(tool) {
    this.currentTool = tool;
    document.querySelectorAll('.map-tool').forEach(b => {
      b.classList.toggle('active', b.dataset.tool === tool);
    });
    this.game.showToast(`Tool: ${tool}`);
  }
}
