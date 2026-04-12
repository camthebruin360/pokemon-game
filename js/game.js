/* ===== game.js — Main Game Engine ===== */

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // State
    this.keys = {};
    this.mousePos = { x: 0, y: 0 };
    this.mouseWorldPos = null;
    this.zoom = 2;
    this.camera = { x: 0, y: 0 };

    // Systems
    this.map = new GameMap(40, 30);
    this.player = new Player(10, 15);
    this.weather = new WeatherSystem();
    this.mapEditor = new MapEditor(this);
    this.spriteDesigner = new SpriteDesigner(this);
    this.devTools = new DevTools(this);

    // Timing
    this.lastTime = 0;
    this.dt = 0;

    // Load saved data
    this.loadSavedData();

    // Bind events
    this.bindEvents();

    // Start game loop
    requestAnimationFrame((t) => this.loop(t));
  }

  loadSavedData() {
    // Try to load saved map
    try {
      const mapData = localStorage.getItem('pokemon-game-map');
      if (mapData) {
        this.map = GameMap.fromJSON(JSON.parse(mapData));
      }
    } catch (e) {
      // Use default map
    }

    // Try to load saved sprite
    try {
      const spriteData = localStorage.getItem('pokemon-game-sprite');
      if (spriteData) {
        const data = JSON.parse(spriteData);
        this.spriteDesigner.spriteSize = data.spriteSize || 32;
        this.spriteDesigner.pixelSize = 256 / this.spriteDesigner.spriteSize;
        this.spriteDesigner.frames = data.frames;
        this.spriteDesigner.pixels = this.spriteDesigner.copyPixels(data.frames[0]);
        this.spriteDesigner.renderSpriteCanvas();
        this.spriteDesigner.updatePreview();
        this.spriteDesigner.updateFrameList();
      }
    } catch (e) {
      // Use default sprite
    }
  }

  bindEvents() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;

      // Dev mode toggle (D key when not typing)
      if (e.key === 'd' || e.key === 'D') {
        if (document.activeElement === document.body || document.activeElement === this.canvas) {
          // Only toggle if not in an input field
          if (e.key === 'D' && e.shiftKey) {
            this.devTools.toggle();
            e.preventDefault();
            return;
          }
        }
      }

      // Ctrl+Z / Ctrl+Y for undo/redo in dev mode
      if (this.devTools.active && this.mapEditor.active) {
        if (this.mapEditor.handleKey(e.key)) {
          e.preventDefault();
          return;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    // Mouse on canvas
    this.canvas.addEventListener('mousedown', (e) => {
      this.updateMousePos(e);
      const world = this.screenToWorld(e.offsetX, e.offsetY);
      if (this.devTools.active && this.mapEditor.active) {
        this.mapEditor.onCanvasMouseDown(world.x, world.y);
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.updateMousePos(e);
      const world = this.screenToWorld(e.offsetX, e.offsetY);
      this.mouseWorldPos = world;

      // Update HUD coordinates
      const tileX = Math.floor(world.x / TILE_SIZE);
      const tileY = Math.floor(world.y / TILE_SIZE);
      const coordsEl = document.getElementById('hud-coords');
      if (coordsEl) coordsEl.textContent = `X: ${tileX}  Y: ${tileY}`;

      if (this.devTools.active && this.mapEditor.active) {
        this.mapEditor.onCanvasMouseMove(world.x, world.y);
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      const world = this.screenToWorld(e.offsetX, e.offsetY);
      if (this.devTools.active && this.mapEditor.active) {
        this.mapEditor.onCanvasMouseUp(world.x, world.y);
      }
    });

    // Mouse wheel zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.25 : 0.25;
      this.zoom = Math.max(0.5, Math.min(4, this.zoom + delta));
      const zoomSlider = document.getElementById('camera-zoom');
      const zoomLabel = document.getElementById('zoom-label');
      if (zoomSlider) zoomSlider.value = this.zoom;
      if (zoomLabel) zoomLabel.textContent = this.zoom + 'x';
    });

    // Prevent context menu on canvas
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  updateMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos.x = e.clientX - rect.left;
    this.mousePos.y = e.clientY - rect.top;
  }

  screenToWorld(sx, sy) {
    return {
      x: (sx / this.zoom) + this.camera.x,
      y: (sy / this.zoom) + this.camera.y
    };
  }

  getMouseWorldPos() {
    return this.mouseWorldPos;
  }

  // === Game Loop ===

  loop(timestamp) {
    this.dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update();
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update() {
    // Only update player movement if not actively using dev tools or in play mode
    if (!this.devTools.active || !this.mapEditor.isDrawing) {
      this.player.update(this.keys, this.map, this.dt);
    }

    // Camera follows player
    const targetCamX = this.player.x * TILE_SIZE - (this.canvas.width / this.zoom) / 2 + TILE_SIZE / 2;
    const targetCamY = this.player.y * TILE_SIZE - (this.canvas.height / this.zoom) / 2 + TILE_SIZE / 2;

    // Smooth camera
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;

    // Clamp camera
    const maxCamX = this.map.width * TILE_SIZE - this.canvas.width / this.zoom;
    const maxCamY = this.map.height * TILE_SIZE - this.canvas.height / this.zoom;
    this.camera.x = Math.max(0, Math.min(maxCamX, this.camera.x));
    this.camera.y = Math.max(0, Math.min(maxCamY, this.camera.y));

    // Update weather
    this.weather.update(this.dt, this.canvas.width, this.canvas.height);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply camera and zoom
    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    // Render map
    this.map.render(ctx, this.camera, this.zoom);

    // Render player
    this.player.render(ctx);

    // Dev mode overlays
    this.mapEditor.renderOverlays(ctx, this.camera, this.zoom);

    // Debug overlays
    this.devTools.renderDebug(ctx, this.dt);

    ctx.restore();

    // Weather (rendered in screen space)
    this.weather.render(ctx, this.canvas.width, this.canvas.height);
  }

  // === Toast Notification ===

  showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('visible');

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
      toast.classList.add('hidden');
    }, 2000);
  }
}

// ===== Start the game =====
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
  window.game.showToast('Press Shift+D to toggle Dev Mode');
});
