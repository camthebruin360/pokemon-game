/* ===== devtools.js — Dev Tools Panel Controller ===== */

class DevTools {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.showFPS = false;
    this.showHitboxes = false;

    this.bindEvents();
  }

  bindEvents() {
    // Dev toggle button
    const toggleBtn = document.getElementById('dev-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }

    // Close button
    const closeBtn = document.getElementById('dev-panel-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggle());
    }

    // Tabs
    document.querySelectorAll('.dev-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.dev-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.dev-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const target = document.getElementById('tab-' + tab.dataset.tab);
        if (target) target.classList.add('active');
      });
    });

    // World Settings
    this.bindSlider('time-of-day', 'time-label', (val) => {
      this.game.weather.setTimeOfDay(parseFloat(val));
      const h = Math.floor(val);
      const m = (val % 1) * 60;
      return `${h}:${m < 10 ? '0' : ''}${Math.floor(m)}`;
    });

    this.bindSlider('player-speed', 'speed-label', (val) => {
      this.game.player.speed = parseInt(val);
      return val;
    });

    this.bindSlider('camera-zoom', 'zoom-label', (val) => {
      this.game.zoom = parseFloat(val);
      return val + 'x';
    });

    // Weather
    const weatherSelect = document.getElementById('weather-select');
    if (weatherSelect) {
      weatherSelect.addEventListener('change', () => {
        this.game.weather.setWeather(weatherSelect.value);
        this.game.showToast(`Weather: ${weatherSelect.value}`);
      });
    }

    // Teleport
    const tpGo = document.getElementById('tp-go');
    if (tpGo) {
      tpGo.addEventListener('click', () => {
        const x = parseInt(document.getElementById('tp-x').value);
        const y = parseInt(document.getElementById('tp-y').value);
        if (!isNaN(x) && !isNaN(y)) {
          this.game.player.x = x;
          this.game.player.y = y;
          this.game.showToast(`Teleported to (${x}, ${y})`);
        }
      });
    }

    // Debug toggles
    const fpsToggle = document.getElementById('show-fps');
    if (fpsToggle) {
      fpsToggle.addEventListener('change', () => { this.showFPS = fpsToggle.checked; });
    }

    const hitboxToggle = document.getElementById('show-hitboxes');
    if (hitboxToggle) {
      hitboxToggle.addEventListener('change', () => { this.showHitboxes = hitboxToggle.checked; });
    }

    const noclipToggle = document.getElementById('noclip');
    if (noclipToggle) {
      noclipToggle.addEventListener('change', () => {
        this.game.player.noclip = noclipToggle.checked;
        this.game.showToast(`No Clip: ${noclipToggle.checked ? 'ON' : 'OFF'}`);
      });
    }
  }

  bindSlider(sliderId, labelId, callback) {
    const slider = document.getElementById(sliderId);
    const label = document.getElementById(labelId);
    if (slider && label) {
      slider.addEventListener('input', () => {
        label.textContent = callback(slider.value);
      });
    }
  }

  toggle() {
    this.active = !this.active;
    const panel = document.getElementById('dev-panel');
    const modeDisplay = document.getElementById('hud-mode');
    const canvas = document.getElementById('game-canvas');

    if (this.active) {
      panel.classList.remove('hidden');
      panel.classList.add('visible');
      modeDisplay.textContent = 'DEV MODE';
      modeDisplay.style.color = '#4fc3f7';
      this.game.mapEditor.active = true;
      canvas.style.cursor = 'crosshair';
    } else {
      panel.classList.remove('visible');
      panel.classList.add('hidden');
      modeDisplay.textContent = 'PLAY MODE';
      modeDisplay.style.color = '#ffd700';
      this.game.mapEditor.active = false;
      canvas.style.cursor = 'default';
    }
  }

  renderDebug(ctx, dt) {
    if (this.showFPS) {
      const fps = Math.round(1 / dt);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(5, 35, 60, 20);
      ctx.fillStyle = fps > 50 ? '#4fc3f7' : fps > 30 ? '#f39c12' : '#e74c3c';
      ctx.font = '12px monospace';
      ctx.fillText(`FPS: ${fps}`, 10, 50);
      ctx.restore();
    }

    if (this.showHitboxes) {
      this.game.player.renderHitbox(ctx);
    }
  }
}
