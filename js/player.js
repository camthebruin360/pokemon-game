/* ===== player.js — Player Character ===== */

class Player {
  constructor(x, y) {
    this.x = x || 10;
    this.y = y || 15;
    this.speed = 3;
    this.direction = 'down'; // up, down, left, right
    this.moving = false;
    this.animFrame = 0;
    this.animTimer = 0;
    this.noclip = false;

    // Default sprite (16x16 pixel art data)
    this.spriteSize = 16;
    this.customSprite = null; // Will be set when user designs one
    this.generateDefaultSprite();
  }

  generateDefaultSprite() {
    // Create a default player sprite that looks like a Pokemon trainer
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');

    // Hair
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(4, 0, 8, 4);
    ctx.fillRect(3, 1, 10, 3);

    // Face
    ctx.fillStyle = '#f0c27a';
    ctx.fillRect(4, 4, 8, 4);

    // Eyes
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(5, 5, 2, 2);
    ctx.fillRect(9, 5, 2, 2);

    // Body (shirt)
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(3, 8, 10, 4);

    // Arms
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(1, 8, 2, 4);
    ctx.fillRect(13, 8, 2, 4);

    // Legs
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(4, 12, 3, 4);
    ctx.fillRect(9, 12, 3, 4);

    this.defaultSprite = canvas;
  }

  getSprite() {
    return this.customSprite || this.defaultSprite;
  }

  setCustomSprite(canvas) {
    this.customSprite = canvas;
  }

  update(keys, map, dt) {
    this.moving = false;
    let dx = 0;
    let dy = 0;

    if (keys['ArrowUp'] || keys['w'] || keys['W']) { dy = -1; this.direction = 'up'; }
    if (keys['ArrowDown'] || keys['s'] || keys['S']) { dy = 1; this.direction = 'down'; }
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) { dx = -1; this.direction = 'left'; }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) { dx = 1; this.direction = 'right'; }

    if (dx !== 0 || dy !== 0) {
      this.moving = true;

      // Normalize diagonal movement
      if (dx !== 0 && dy !== 0) {
        const mag = Math.sqrt(2);
        dx /= mag;
        dy /= mag;
      }

      const newX = this.x + dx * this.speed * dt;
      const newY = this.y + dy * this.speed * dt;

      if (this.noclip) {
        this.x = newX;
        this.y = newY;
      } else {
        // Check collision per axis
        const tileNewX = Math.floor(newX);
        const tileNewY = Math.floor(newY);
        const tileCurX = Math.floor(this.x);
        const tileCurY = Math.floor(this.y);

        if (!map.isCollision(tileNewX, tileCurY)) {
          this.x = newX;
        }
        if (!map.isCollision(tileCurX, tileNewY)) {
          this.y = newY;
        }
        // Corner check
        if (!map.isCollision(Math.floor(this.x), Math.floor(this.y))) {
          // fine
        }
      }

      // Clamp to map bounds
      this.x = Math.max(0, Math.min(map.width - 1, this.x));
      this.y = Math.max(0, Math.min(map.height - 1, this.y));
    }

    // Animation
    if (this.moving) {
      this.animTimer += dt * 8;
      if (this.animTimer >= 1) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 4;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }
  }

  render(ctx) {
    const sprite = this.getSprite();
    const px = this.x * TILE_SIZE;
    const py = this.y * TILE_SIZE;

    ctx.save();

    // Bobbing animation when moving
    const bob = this.moving ? Math.sin(this.animFrame * Math.PI / 2) * 1.5 : 0;

    ctx.drawImage(sprite, px, py - bob, TILE_SIZE, TILE_SIZE);

    // Direction indicator (small shadow)
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(px + TILE_SIZE / 2, py + TILE_SIZE - 1, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderHitbox(ctx) {
    const px = this.x * TILE_SIZE;
    const py = this.y * TILE_SIZE;
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = 'rgba(255,255,0,0.1)';
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
  }
}
