/* ===== spriteDesigner.js — Pixel Art Sprite Designer ===== */

class SpriteDesigner {
  constructor(game) {
    this.game = game;
    this.spriteSize = 32; // pixels
    this.pixelSize = 256 / this.spriteSize; // how big each pixel appears on canvas
    this.currentColor = '#ff0000';
    this.currentTool = 'pencil';
    this.mirrorMode = false;
    this.isDrawing = false;
    this.lineStart = null;

    // Pixel data: 2D array of color strings (null = transparent)
    this.pixels = this.createEmptyPixels();

    // Animation frames
    this.frames = [this.createEmptyPixels()];
    this.currentFrame = 0;
    this.animPlaying = false;
    this.animInterval = null;

    // Canvas refs
    this.canvas = document.getElementById('sprite-canvas');
    this.preview = document.getElementById('sprite-preview');

    this.init();
  }

  createEmptyPixels() {
    const pixels = [];
    for (let y = 0; y < this.spriteSize; y++) {
      pixels[y] = [];
      for (let x = 0; x < this.spriteSize; x++) {
        pixels[y][x] = null;
      }
    }
    return pixels;
  }

  copyPixels(src) {
    return src.map(row => [...row]);
  }

  init() {
    this.buildColorPalette();
    this.buildPresets();
    this.bindEvents();
    this.updateFrameList();
    this.renderSpriteCanvas();
  }

  buildColorPalette() {
    const palette = document.getElementById('color-palette');
    if (!palette) return;

    const colors = [
      '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
      '#2c3e50', '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22',
      '#f0c27a', '#d4a574', '#8B4513', '#4a2810', '#7f8c8d', '#95a5a6', '#bdc3c7', '#ecf0f1',
      '#c0392b', '#2980b9', '#27ae60', '#f1c40f', '#8e44ad', '#16a085', '#d35400', '#34495e',
    ];

    for (const color of colors) {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch' + (color === this.currentColor ? ' active' : '');
      swatch.style.background = color;
      swatch.dataset.color = color;
      swatch.addEventListener('click', () => {
        this.currentColor = color;
        document.getElementById('sprite-color').value = color;
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
      });
      palette.appendChild(swatch);
    }
  }

  buildPresets() {
    const container = document.getElementById('sprite-presets');
    if (!container) return;

    const presets = [
      { name: '🧑 Trainer', fn: () => this.presetTrainer() },
      { name: '🐱 Cat', fn: () => this.presetCat() },
      { name: '🚗 Car', fn: () => this.presetCar() },
      { name: '🐉 Dragon', fn: () => this.presetDragon() },
      { name: '⭐ Star', fn: () => this.presetStar() },
      { name: '🏠 House', fn: () => this.presetHouse() },
      { name: '🌳 Tree', fn: () => this.presetTreeSprite() },
      { name: '💎 Gem', fn: () => this.presetGem() },
    ];

    for (const preset of presets) {
      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.textContent = preset.name;
      btn.addEventListener('click', () => {
        preset.fn();
        this.renderSpriteCanvas();
        this.updatePreview();
        this.game.showToast(`Loaded preset: ${preset.name}`);
      });
      container.appendChild(btn);
    }
  }

  bindEvents() {
    // Sprite canvas mouse events
    if (this.canvas) {
      this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
      this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
      this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
      this.canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));
    }

    // Tool buttons
    document.querySelectorAll('.sprite-tool').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sprite-tool').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTool = btn.dataset.tool;
        if (this.currentTool === 'mirror') {
          this.mirrorMode = !this.mirrorMode;
          btn.classList.toggle('active', this.mirrorMode);
          this.game.showToast(`Mirror: ${this.mirrorMode ? 'ON' : 'OFF'}`);
          this.currentTool = 'pencil'; // revert to pencil
        }
      });
    });

    // Color picker
    const colorPicker = document.getElementById('sprite-color');
    if (colorPicker) {
      colorPicker.addEventListener('input', () => {
        this.currentColor = colorPicker.value;
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      });
    }

    // Sprite size
    const sizeSelect = document.getElementById('sprite-size');
    if (sizeSelect) {
      sizeSelect.addEventListener('change', () => {
        this.spriteSize = parseInt(sizeSelect.value);
        this.pixelSize = 256 / this.spriteSize;
        this.pixels = this.createEmptyPixels();
        this.frames = [this.createEmptyPixels()];
        this.currentFrame = 0;
        this.updateFrameList();
        this.renderSpriteCanvas();
        this.updatePreview();
      });
    }

    // Frame controls
    this.bindAction('frame-add', () => this.addFrame());
    this.bindAction('frame-delete', () => this.deleteFrame());
    this.bindAction('frame-play', () => this.toggleAnimation());

    // Actions
    this.bindAction('sprite-save', () => this.saveSprite());
    this.bindAction('sprite-load', () => document.getElementById('sprite-file-input').click());
    this.bindAction('sprite-export', () => this.exportPNG());
    this.bindAction('sprite-apply', () => this.applyToPlayer());

    // File input
    const fileInput = document.getElementById('sprite-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.loadSpriteFile(e));
    }
  }

  bindAction(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
  }

  // === Canvas Mouse Events ===

  getPixelCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.pixelSize);
    const y = Math.floor((e.clientY - rect.top) / this.pixelSize);
    return { x: Math.max(0, Math.min(this.spriteSize - 1, x)), y: Math.max(0, Math.min(this.spriteSize - 1, y)) };
  }

  onMouseDown(e) {
    this.isDrawing = true;
    const pos = this.getPixelCoords(e);

    if (this.currentTool === 'line') {
      this.lineStart = pos;
    } else if (this.currentTool === 'fill') {
      this.floodFill(pos.x, pos.y);
      this.renderSpriteCanvas();
      this.updatePreview();
    } else {
      this.drawPixel(pos.x, pos.y);
      this.renderSpriteCanvas();
      this.updatePreview();
    }
  }

  onMouseMove(e) {
    if (!this.isDrawing) return;
    const pos = this.getPixelCoords(e);

    if (this.currentTool === 'pencil' || this.currentTool === 'eraser') {
      this.drawPixel(pos.x, pos.y);
      this.renderSpriteCanvas();
      this.updatePreview();
    }
  }

  onMouseUp(e) {
    if (this.currentTool === 'line' && this.lineStart && this.canvas) {
      const pos = this.getPixelCoords(e || { clientX: 0, clientY: 0 });
      this.drawLine(this.lineStart.x, this.lineStart.y, pos.x, pos.y, this.currentColor);
      this.renderSpriteCanvas();
      this.updatePreview();
      this.lineStart = null;
    }
    this.isDrawing = false;
    // Save current state to frame
    this.frames[this.currentFrame] = this.copyPixels(this.pixels);
  }

  drawPixel(x, y) {
    if (x < 0 || x >= this.spriteSize || y < 0 || y >= this.spriteSize) return;

    if (this.currentTool === 'eraser') {
      this.pixels[y][x] = null;
      if (this.mirrorMode) {
        this.pixels[y][this.spriteSize - 1 - x] = null;
      }
    } else {
      this.pixels[y][x] = this.currentColor;
      if (this.mirrorMode) {
        this.pixels[y][this.spriteSize - 1 - x] = this.currentColor;
      }
    }
  }

  floodFill(startX, startY) {
    const targetColor = this.pixels[startY][startX];
    const fillColor = this.currentTool === 'eraser' ? null : this.currentColor;
    if (targetColor === fillColor) return;

    const stack = [[startX, startY]];
    const visited = new Set();

    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      if (x < 0 || x >= this.spriteSize || y < 0 || y >= this.spriteSize) continue;
      if (this.pixels[y][x] !== targetColor) continue;

      visited.add(key);
      this.pixels[y][x] = fillColor;

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }

  // === Rendering ===

  renderSpriteCanvas() {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);

    // Draw checkerboard background (for transparency)
    for (let y = 0; y < this.spriteSize; y++) {
      for (let x = 0; x < this.spriteSize; x++) {
        const isLight = (x + y) % 2 === 0;
        ctx.fillStyle = isLight ? '#3a3a3a' : '#2a2a2a';
        ctx.fillRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
      }
    }

    // Draw pixels
    for (let y = 0; y < this.spriteSize; y++) {
      for (let x = 0; x < this.spriteSize; x++) {
        if (this.pixels[y][x]) {
          ctx.fillStyle = this.pixels[y][x];
          ctx.fillRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
        }
      }
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= this.spriteSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * this.pixelSize, 0);
      ctx.lineTo(i * this.pixelSize, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * this.pixelSize);
      ctx.lineTo(256, i * this.pixelSize);
      ctx.stroke();
    }
  }

  updatePreview() {
    if (!this.preview) return;
    const ctx = this.preview.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);

    const scale = 64 / this.spriteSize;
    for (let y = 0; y < this.spriteSize; y++) {
      for (let x = 0; x < this.spriteSize; x++) {
        if (this.pixels[y][x]) {
          ctx.fillStyle = this.pixels[y][x];
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  }

  // === Animation Frames ===

  addFrame() {
    this.frames.push(this.copyPixels(this.pixels));
    this.currentFrame = this.frames.length - 1;
    this.updateFrameList();
    this.game.showToast(`Frame ${this.currentFrame + 1} added`);
  }

  deleteFrame() {
    if (this.frames.length <= 1) {
      this.game.showToast('Cannot delete last frame');
      return;
    }
    this.frames.splice(this.currentFrame, 1);
    this.currentFrame = Math.min(this.currentFrame, this.frames.length - 1);
    this.pixels = this.copyPixels(this.frames[this.currentFrame]);
    this.updateFrameList();
    this.renderSpriteCanvas();
    this.updatePreview();
    this.game.showToast('Frame deleted');
  }

  switchFrame(index) {
    // Save current
    this.frames[this.currentFrame] = this.copyPixels(this.pixels);
    // Load new
    this.currentFrame = index;
    this.pixels = this.copyPixels(this.frames[index]);
    this.updateFrameList();
    this.renderSpriteCanvas();
    this.updatePreview();
  }

  updateFrameList() {
    const list = document.getElementById('frame-list');
    if (!list) return;
    list.innerHTML = '';

    for (let i = 0; i < this.frames.length; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 40;
      canvas.height = 40;
      canvas.className = 'frame-thumb' + (i === this.currentFrame ? ' active' : '');
      const ctx = canvas.getContext('2d');
      const scale = 40 / this.spriteSize;

      const frame = this.frames[i];
      for (let y = 0; y < this.spriteSize; y++) {
        for (let x = 0; x < this.spriteSize; x++) {
          if (frame[y][x]) {
            ctx.fillStyle = frame[y][x];
            ctx.fillRect(x * scale, y * scale, scale, scale);
          }
        }
      }

      canvas.addEventListener('click', () => this.switchFrame(i));
      list.appendChild(canvas);
    }
  }

  toggleAnimation() {
    if (this.animPlaying) {
      clearInterval(this.animInterval);
      this.animPlaying = false;
      this.game.showToast('Animation stopped');
    } else {
      this.animPlaying = true;
      let frame = 0;
      this.animInterval = setInterval(() => {
        frame = (frame + 1) % this.frames.length;
        this.pixels = this.copyPixels(this.frames[frame]);
        this.renderSpriteCanvas();
        this.updatePreview();
      }, 200);
      this.game.showToast('Playing animation...');
    }
  }

  // === Save/Load/Export ===

  saveSprite() {
    const data = JSON.stringify({
      spriteSize: this.spriteSize,
      frames: this.frames
    });
    localStorage.setItem('pokemon-game-sprite', data);
    this.game.showToast('Sprite saved to browser storage');
  }

  loadSpriteFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        this.spriteSize = data.spriteSize || 32;
        this.pixelSize = 256 / this.spriteSize;
        this.frames = data.frames;
        this.currentFrame = 0;
        this.pixels = this.copyPixels(this.frames[0]);
        document.getElementById('sprite-size').value = this.spriteSize;
        this.updateFrameList();
        this.renderSpriteCanvas();
        this.updatePreview();
        this.game.showToast('Sprite loaded!');
      } catch (err) {
        this.game.showToast('Error loading sprite file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  exportPNG() {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.spriteSize;
    exportCanvas.height = this.spriteSize;
    const ctx = exportCanvas.getContext('2d');

    for (let y = 0; y < this.spriteSize; y++) {
      for (let x = 0; x < this.spriteSize; x++) {
        if (this.pixels[y][x]) {
          ctx.fillStyle = this.pixels[y][x];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    const link = document.createElement('a');
    link.download = 'sprite.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
    this.game.showToast('Sprite exported as PNG');
  }

  applyToPlayer() {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.spriteSize;
    exportCanvas.height = this.spriteSize;
    const ctx = exportCanvas.getContext('2d');

    for (let y = 0; y < this.spriteSize; y++) {
      for (let x = 0; x < this.spriteSize; x++) {
        if (this.pixels[y][x]) {
          ctx.fillStyle = this.pixels[y][x];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    this.game.player.setCustomSprite(exportCanvas);
    this.game.showToast('Sprite applied to player!');
  }

  // === Presets ===

  clearPixels() {
    this.pixels = this.createEmptyPixels();
  }

  setPixel(x, y, color) {
    if (x >= 0 && x < this.spriteSize && y >= 0 && y < this.spriteSize) {
      this.pixels[y][x] = color;
    }
  }

  fillRect(x1, y1, w, h, color) {
    for (let y = y1; y < y1 + h; y++) {
      for (let x = x1; x < x1 + w; x++) {
        this.setPixel(x, y, color);
      }
    }
  }

  presetTrainer() {
    this.clearPixels();
    const s = this.spriteSize;
    const scale = s / 16;

    // Hair
    this.fillRect(4 * scale, 0, 8 * scale, 3 * scale, '#2c3e50');
    // Face
    this.fillRect(4 * scale, 3 * scale, 8 * scale, 4 * scale, '#f0c27a');
    // Eyes
    this.fillRect(5 * scale, 4 * scale, 2 * scale, 2 * scale, '#2c3e50');
    this.fillRect(9 * scale, 4 * scale, 2 * scale, 2 * scale, '#2c3e50');
    // Shirt
    this.fillRect(3 * scale, 7 * scale, 10 * scale, 4 * scale, '#e74c3c');
    // Arms
    this.fillRect(1 * scale, 7 * scale, 2 * scale, 4 * scale, '#e74c3c');
    this.fillRect(13 * scale, 7 * scale, 2 * scale, 4 * scale, '#e74c3c');
    // Pants
    this.fillRect(4 * scale, 11 * scale, 3 * scale, 4 * scale, '#2980b9');
    this.fillRect(9 * scale, 11 * scale, 3 * scale, 4 * scale, '#2980b9');
    // Shoes
    this.fillRect(3 * scale, 15 * scale, 4 * scale, 1 * scale, '#2c3e50');
    this.fillRect(9 * scale, 15 * scale, 4 * scale, 1 * scale, '#2c3e50');

    this.frames[this.currentFrame] = this.copyPixels(this.pixels);
    this.updateFrameList();
  }

  presetCar() {
    this.clearPixels();
    const s = this.spriteSize;
    const scale = s / 16;

    // Body
    this.fillRect(1 * scale, 6 * scale, 14 * scale, 5 * scale, '#e74c3c');
    // Top
    this.fillRect(3 * scale, 3 * scale, 10 * scale, 3 * scale, '#c0392b');
    // Windows
    this.fillRect(4 * scale, 4 * scale, 3 * scale, 2 * scale, '#85c1e9');
    this.fillRect(9 * scale, 4 * scale, 3 * scale, 2 * scale, '#85c1e9');
    // Wheels
    this.fillRect(2 * scale, 11 * scale, 3 * scale, 3 * scale, '#2c3e50');
    this.fillRect(11 * scale, 11 * scale, 3 * scale, 3 * scale, '#2c3e50');
    // Wheel centers
    this.fillRect(3 * scale, 12 * scale, 1 * scale, 1 * scale, '#95a5a6');
    this.fillRect(12 * scale, 12 * scale, 1 * scale, 1 * scale, '#95a5a6');
    // Headlights
    this.fillRect(14 * scale, 7 * scale, 1 * scale, 2 * scale, '#f1c40f');
    // Taillight
    this.fillRect(1 * scale, 7 * scale, 1 * scale, 2 * scale, '#e74c3c');
    // Bumper
    this.fillRect(1 * scale, 10 * scale, 14 * scale, 1 * scale, '#7f8c8d');

    this.frames[this.currentFrame] = this.copyPixels(this.pixels);
    this.updateFrameList();
  }

  presetCat() {
    this.clearPixels();
    const s = this.spriteSize;
    const scale = s / 16;

    // Ears
    this.fillRect(2 * scale, 1 * scale, 3 * scale, 3 * scale, '#e67e22');
    this.fillRect(11 * scale, 1 * scale, 3 * scale, 3 * scale, '#e67e22');
    // Head
    this.fillRect(3 * scale, 3 * scale, 10 * scale, 6 * scale, '#f39c12');
    // Eyes
    this.fillRect(5 * scale, 5 * scale, 2 * scale, 2 * scale, '#2ecc71');
    this.fillRect(9 * scale, 5 * scale, 2 * scale, 2 * scale, '#2ecc71');
    // Nose
    this.fillRect(7 * scale, 7 * scale, 2 * scale, 1 * scale, '#e74c3c');
    // Body
    this.fillRect(4 * scale, 9 * scale, 8 * scale, 4 * scale, '#f39c12');
    // Legs
    this.fillRect(4 * scale, 13 * scale, 2 * scale, 2 * scale, '#f39c12');
    this.fillRect(10 * scale, 13 * scale, 2 * scale, 2 * scale, '#f39c12');
    // Tail
    this.fillRect(12 * scale, 10 * scale, 3 * scale, 1 * scale, '#e67e22');
    this.fillRect(14 * scale, 9 * scale, 1 * scale, 2 * scale, '#e67e22');

    this.frames[this.currentFrame] = this.copyPixels(this.pixels);
    this.updateFrameList();
  }

  presetDragon() {
    this.clearPixels();
    const s = this.spriteSize;
    const scale = s / 16;

    // Head
    this.fillRect(5 * scale, 1 * scale, 6 * scale, 5 * scale, '#27ae60');
    // Eyes
    this.fillRect(6 * scale, 2 * scale, 2 * scale, 2 * scale, '#f1c40f');
    // Horns
    this.fillRect(5 * scale, 0, 1 * scale, 2 * scale, '#8e44ad');
    this.fillRect(10 * scale, 0, 1 * scale, 2 * scale, '#8e44ad');
    // Body
    this.fillRect(4 * scale, 6 * scale, 8 * scale, 5 * scale, '#2ecc71');
    // Wings
    this.fillRect(0, 5 * scale, 4 * scale, 4 * scale, '#1abc9c');
    this.fillRect(12 * scale, 5 * scale, 4 * scale, 4 * scale, '#1abc9c');
    // Belly
    this.fillRect(6 * scale, 7 * scale, 4 * scale, 3 * scale, '#f1c40f');
    // Legs
    this.fillRect(5 * scale, 11 * scale, 2 * scale, 3 * scale, '#27ae60');
    this.fillRect(9 * scale, 11 * scale, 2 * scale, 3 * scale, '#27ae60');
    // Tail
    this.fillRect(5 * scale, 14 * scale, 8 * scale, 1 * scale, '#2ecc71');
    this.fillRect(12 * scale, 13 * scale, 2 * scale, 1 * scale, '#2ecc71');
    // Fire breath
    this.fillRect(11 * scale, 3 * scale, 3 * scale, 2 * scale, '#e74c3c');
    this.fillRect(13 * scale, 2 * scale, 2 * scale, 1 * scale, '#f39c12');

    this.frames[this.currentFrame] = this.copyPixels(this.pixels);
    this.updateFrameList();
  }

  presetStar() {
    this.clearPixels();
    const cx = Math.floor(this.spriteSize / 2);
    const cy = Math.floor(this.spriteSize / 2);
    const outer = Math.floor(this.spriteSize * 0.45);
    const inner = Math.floor(this.spriteSize * 0.2);

    for (let i = 0; i < 5; i++) {
      const angle1 = (i * 72 - 90) * Math.PI / 180;
      const angle2 = ((i * 72 + 36) - 90) * Math.PI / 180;

      const ox = Math.round(cx + outer * Math.cos(angle1));
      const oy = Math.round(cy + outer * Math.sin(angle1));
      const ix = Math.round(cx + inner * Math.cos(angle2));
      const iy = Math.round(cy + inner * Math.sin(angle2));

      // Draw lines from center to points
      this.drawLine(cx, cy, ox, oy, '#f1c40f');
      this.drawLine(cx, cy, ix, iy, '#f39c12');
      this.drawLine(ox, oy, ix, iy, '#f1c40f');

      const nextAngle = ((i + 1) * 72 - 90) * Math.PI / 180;
      const nox = Math.round(cx + outer * Math.cos(nextAngle));
      const noy = Math.round(cy + outer * Math.sin(nextAngle));
      this.drawLine(ix, iy, nox, noy, '#f1c40f');
    }

    this.frames[this.currentFrame] = this.copyPixels(this.pixels);
    this.updateFrameList();
  }

  presetHouse() {
    this.clearPixels();
    const s = this.spriteSize;
    const scale = s / 16;

    // Roof
    for (let i = 0; i < 5 * scale; i++) {
      this.fillRect((3 * scale + Math.floor(i * 0.6)), i, Math.floor(10 * scale - i * 1.2), 1, '#c0392b');
    }
    // Walls
    this.fillRect(3 * scale, 5 * scale, 10 * scale, 9 * scale, '#ecf0f1');
    // Door
    this.fillRect(6 * scale, 9 * scale, 4 * scale, 5 * scale, '#8B6914');
    // Doorknob
    this.fillRect(9 * scale, 11 * scale, 1 * scale, 1 * scale, '#f1c40f');
    // Windows
    this.fillRect(4 * scale, 6 * scale, 2 * scale, 2 * scale, '#85c1e9');
    this.fillRect(10 * scale, 6 * scale, 2 * scale, 2 * scale, '#85c1e9');

    this.frames[this.currentFrame] = this.copyPixels(this.pixels);
    this.updateFrameList();
  }

  presetTreeSprite() {
    this.clearPixels();
    const s = this.spriteSize;
    const scale = s / 16;
    const cx = Math.floor(s / 2);

    // Trunk
    this.fillRect(cx - scale, 8 * scale, 2 * scale, 7 * scale, '#8B4513');
    // Canopy
    this.fillRect(cx - 5 * scale, 2 * scale, 10 * scale, 7 * scale, '#27ae60');
    this.fillRect(cx - 4 * scale, 1 * scale, 8 * scale, 2 * scale, '#2ecc71');
    this.fillRect(cx - 3 * scale, 0, 6 * scale, 2 * scale, '#27ae60');

    this.frames[this.currentFrame] = this.copyPixels(this.pixels);
    this.updateFrameList();
  }

  presetGem() {
    this.clearPixels();
    const s = this.spriteSize;
    const cx = Math.floor(s / 2);
    const cy = Math.floor(s / 2);
    const scale = s / 16;

    // Diamond shape
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const dx = Math.abs(x - cx);
        const dy = Math.abs(y - cy);
        if (dx * 0.6 + dy * 1.0 < 6 * scale) {
          const shade = (dx + dy) / (6 * scale);
          if (shade < 0.3) this.setPixel(x, y, '#5dade2');
          else if (shade < 0.6) this.setPixel(x, y, '#2e86c1');
          else this.setPixel(x, y, '#1a5276');
        }
      }
    }

    // Highlight
    this.fillRect(cx - 2 * scale, cy - 3 * scale, 2 * scale, 2 * scale, '#aed6f1');

    this.frames[this.currentFrame] = this.copyPixels(this.pixels);
    this.updateFrameList();
  }

  drawLine(x0, y0, x1, y1, color) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      this.setPixel(x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }
}
