// js/snake.js
(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const levelEl = document.getElementById('level');
  const btnStart = document.getElementById('btnStart');
  const btnPause = document.getElementById('btnPause');
  const btnRestart = document.getElementById('btnRestart');
  const speedRange = document.getElementById('speedRange');
  const skinButtons = Array.from(document.querySelectorAll('[data-skin]'));

  const CELL = 20; // tamaño base en px (se escala con canvas)
  let cols = Math.floor(canvas.width / CELL);
  let rows = Math.floor(canvas.height / CELL);

  let snake = [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let apple = null;
  let running = false;
  let paused = false;
  let score = 0;
  let best = parseInt(localStorage.getItem('snakeBest') || '0', 10);
  let level = 1;
  let speed = parseInt(speedRange.value, 10); // frames per second-ish
  let tickInterval = null;
  let skin = localStorage.getItem('snakeSkin') || 'classic';

  bestEl.textContent = best;
  scoreEl.textContent = score;
  levelEl.textContent = level;

  function resetGame() {
    cols = Math.floor(canvas.width / CELL);
    rows = Math.floor(canvas.height / CELL);
    snake = [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    apple = spawnApple();
    score = 0;
    level = 1;
    updateHUD();
    draw();
  }

  function spawnApple() {
    const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
    let tries = 0;
    while (tries < 1000) {
      const x = Math.floor(Math.random() * cols);
      const y = Math.floor(Math.random() * rows);
      if (!occupied.has(`${x},${y}`)) return { x, y };
      tries++;
    }
    return { x: 0, y: 0 };
  }

  function updateHUD() {
    scoreEl.textContent = score;
    bestEl.textContent = best;
    levelEl.textContent = level;
  }

  function drawCell(x, y, color, radius = 4) {
    const px = x * CELL;
    const py = y * CELL;
    ctx.fillStyle = color;
    roundRect(ctx, px + 1, py + 1, CELL - 2, CELL - 2, radius);
    ctx.fill();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // subtle grid lines (optional)
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, rows * CELL);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(cols * CELL, y * CELL + 0.5);
      ctx.stroke();
    }
  }

  function draw() {
    drawGrid();
    // apple
    if (apple) {
      if (skin === 'neon') {
        drawCell(apple.x, apple.y, '#00ff95', 6);
      } else if (skin === 'meme') {
        // draw a meme-like square with red accent
        drawCell(apple.x, apple.y, '#e50914', 6);
      } else {
        drawCell(apple.x, apple.y, '#ffcc00', 6);
      }
    }
    // snake
    for (let i = 0; i < snake.length; i++) {
      const s = snake[i];
      if (i === 0) {
        // head
        drawCell(s.x, s.y, skin === 'neon' ? '#0ff' : '#9bf59b', 6);
      } else {
        drawCell(s.x, s.y, skin === 'neon' ? '#0f0' : '#3b3b3b', 4);
      }
    }
  }

  function step() {
    if (!running || paused) return;
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    // wrap-around
    if (head.x < 0) head.x = cols - 1;
    if (head.x >= cols) head.x = 0;
    if (head.y < 0) head.y = rows - 1;
    if (head.y >= rows) head.y = 0;
    // collision with self
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      gameOver();
      return;
    }
    snake.unshift(head);
    // eat apple
    if (apple && head.x === apple.x && head.y === apple.y) {
      score += 10 * level;
      // increase level every 50 points
      if (score >= level * 50) {
        level++;
      }
      apple = spawnApple();
      // increase speed slightly
      adjustInterval();
    } else {
      snake.pop();
    }
    if (score > best) {
      best = score;
      localStorage.setItem('snakeBest', String(best));
    }
    updateHUD();
    draw();
  }

  function gameOver() {
    running = false;
    clearInterval(tickInterval);
    tickInterval = null;
    updateHUD();
    // simple flash effect
    ctx.fillStyle = 'rgba(229,9,20,0.12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setTimeout(() => draw(), 200);
  }

  function start() {
    if (running) return;
    running = true;
    paused = false;
    adjustInterval();
    updateHUD();
  }

  function pause() {
    paused = !paused;
    btnPause.textContent = paused ? 'Reanudar' : 'Pausa';
  }

  function restart() {
    resetGame();
    running = true;
    paused = false;
    adjustInterval();
  }

  function adjustInterval() {
    if (tickInterval) clearInterval(tickInterval);
    const base = 220; // base ms
    const ms = Math.max(40, base - (speed * 10) - (level - 1) * 8);
    tickInterval = setInterval(step, ms);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (!running && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)) start();
    switch (e.key) {
      case 'ArrowUp': case 'w': if (dir.y === 0) nextDir = { x: 0, y: -1 }; break;
      case 'ArrowDown': case 's': if (dir.y === 0) nextDir = { x: 0, y: 1 }; break;
      case 'ArrowLeft': case 'a': if (dir.x === 0) nextDir = { x: -1, y: 0 }; break;
      case 'ArrowRight': case 'd': if (dir.x === 0) nextDir = { x: 1, y: 0 }; break;
      case ' ': pause(); break;
    }
  });

  // Touch swipe detection
  (function touchControls() {
    let startX = 0, startY = 0, startTime = 0;
    canvas.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY; startTime = Date.now();
    }, { passive: true });

    canvas.addEventListener('touchend', e => {
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Date.now() - startTime;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20 && dt < 300) {
        // tap -> start/pause toggle
        if (!running) start(); else pause();
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && dir.x === 0) nextDir = { x: 1, y: 0 };
        if (dx < 0 && dir.x === 0) nextDir = { x: -1, y: 0 };
      } else {
        if (dy > 0 && dir.y === 0) nextDir = { x: 0, y: 1 };
        if (dy < 0 && dir.y === 0) nextDir = { x: 0, y: -1 };
      }
      if (!running) start();
    }, { passive: true });
  })();

  // Resize handling to keep grid consistent
  function resizeCanvas() {
    // keep square canvas based on container width
    const rect = canvas.getBoundingClientRect();
    const size = Math.min(window.innerWidth - 40, 640);
    canvas.width = size - (size % CELL);
    canvas.height = size - (size % CELL);
    cols = Math.floor(canvas.width / CELL);
    rows = Math.floor(canvas.height / CELL);
    // reposition apple if out of bounds
    if (apple && (apple.x >= cols || apple.y >= rows)) apple = spawnApple();
    draw();
  }
  window.addEventListener('resize', () => { resizeCanvas(); });
  resizeCanvas();

  // UI bindings
  btnStart.addEventListener('click', () => start());
  btnPause.addEventListener('click', () => pause());
  btnRestart.addEventListener('click', () => restart());
  speedRange.addEventListener('input', e => {
    speed = parseInt(e.target.value, 10);
    adjustInterval();
  });

  skinButtons.forEach(b => {
    b.addEventListener('click', () => {
      skin = b.dataset.skin;
      localStorage.setItem('snakeSkin', skin);
      skinButtons.forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      draw();
    });
    if (b.dataset.skin === skin) b.classList.add('active');
  });

  // initial setup
  resetGame();
  draw();

  // expose for debugging (optional)
  window._snake = { resetGame, start, pause, restart };
})();
