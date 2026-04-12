/* ===== weather.js — Weather Effects ===== */

class WeatherSystem {
  constructor() {
    this.type = 'clear';
    this.particles = [];
    this.timeOfDay = 12;
    this.maxParticles = 200;
  }

  setWeather(type) {
    this.type = type;
    this.particles = [];
  }

  setTimeOfDay(hour) {
    this.timeOfDay = hour;
  }

  update(dt, canvasWidth, canvasHeight) {
    if (this.type === 'clear') {
      this.particles = [];
      return;
    }

    // Spawn particles
    while (this.particles.length < this.maxParticles) {
      this.particles.push(this.createParticle(canvasWidth, canvasHeight));
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      if (p.life <= 0 || p.y > canvasHeight || p.x < -20 || p.x > canvasWidth + 20) {
        this.particles.splice(i, 1);
      }
    }
  }

  createParticle(w, h) {
    switch (this.type) {
      case 'rain':
        return {
          x: Math.random() * (w + 100) - 50,
          y: -10,
          vx: -30 + Math.random() * 10,
          vy: 200 + Math.random() * 100,
          size: 1 + Math.random(),
          life: 3 + Math.random() * 2
        };
      case 'snow':
        return {
          x: Math.random() * w,
          y: -10,
          vx: -10 + Math.random() * 20,
          vy: 20 + Math.random() * 30,
          size: 2 + Math.random() * 3,
          life: 8 + Math.random() * 4
        };
      case 'fog':
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: 5 + Math.random() * 10,
          vy: -2 + Math.random() * 4,
          size: 40 + Math.random() * 60,
          life: 5 + Math.random() * 5,
          alpha: 0.05 + Math.random() * 0.1
        };
      default:
        return { x: 0, y: 0, vx: 0, vy: 0, size: 0, life: 0 };
    }
  }

  render(ctx, canvasWidth, canvasHeight) {
    // Time-of-day overlay
    const overlay = this.getTimeOverlay();
    if (overlay) {
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Weather particles
    switch (this.type) {
      case 'rain':
        ctx.strokeStyle = 'rgba(150,200,255,0.5)';
        ctx.lineWidth = 1;
        for (const p of this.particles) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 0.02, p.y + p.vy * 0.02);
          ctx.stroke();
        }
        break;

      case 'snow':
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for (const p of this.particles) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'fog':
        for (const p of this.particles) {
          const alpha = p.alpha || 0.08;
          ctx.fillStyle = `rgba(200,200,220,${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
    }
  }

  getTimeOverlay() {
    const h = this.timeOfDay;
    if (h >= 6 && h <= 18) {
      // Daytime — no overlay or warm tint near edges
      if (h < 8) {
        const t = (h - 6) / 2;
        return `rgba(255,200,100,${0.15 * (1 - t)})`;
      }
      if (h > 16) {
        const t = (h - 16) / 2;
        return `rgba(255,150,50,${0.15 * t})`;
      }
      return null;
    }
    if (h > 18 && h <= 21) {
      const t = (h - 18) / 3;
      return `rgba(10,10,40,${0.5 * t})`;
    }
    if (h > 21 || h < 5) {
      return 'rgba(10,10,40,0.5)';
    }
    if (h >= 5 && h < 6) {
      const t = (h - 5);
      return `rgba(10,10,40,${0.5 * (1 - t)})`;
    }
    return null;
  }
}
