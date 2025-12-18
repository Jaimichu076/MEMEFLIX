// js/buscameemes.js — Motor Buscaminas Memeflix (modular y robusto)
(() => {
  const levels = {
    facil:       { cols: 9,  rows: 9,  mines: 10, label: 'Fácil' },
    intermedio:  { cols: 13, rows: 13, mines: 24, label: 'Intermedio' },
    sixseveeeen: { cols: 16, rows: 16, mines: 36, label: 'Six Seveeeen' }
  };

  // Estado
  let state = {
    key: null,
    grid: [],
    cols: 0,
    rows: 0,
    mines: 0,
    safeLeft: 0,
    running: false,
    time: 0,
    timerId: null
  };

  // UI (inyectada por HTML)
  const UI = window.BuscaminesUI || {};
  const boardEl = UI.boardEl || document.getElementById('board');
  const hud = UI.hud || {
    level: document.getElementById('hudLevel'),
    timer: document.getElementById('hudTimer'),
    safe:  document.getElementById('hudSafe'),
    state: document.getElementById('hudState')
  };
  const btnReset = UI.btnReset || document.getElementById('btnReset');
  const toast = UI.showToast || ((t)=>console.log('[Toast]',t));

  // Utilidades
  function setHudState(msg){ if(hud.state) hud.state.textContent = msg; }
  function setHudTimer(t){ if(hud.timer) hud.timer.textContent = formatTime(t); }
  function setHudLevel(label){ if(hud.level) hud.level.textContent = label; }
  function setHudSafe(n){ if(hud.safe) hud.safe.textContent = n; }
  function formatTime(t){ const m=String(Math.floor(t/60)).padStart(2,'0'); const s=String(t%60).padStart(2,'0'); return `${m}:${s}`; }

  function startTimer(){
    stopTimer();
    state.time = 0;
    setHudTimer(state.time);
    state.timerId = setInterval(() => {
      if(!state.running) return;
      state.time++;
      setHudTimer(state.time);
    }, 1000);
  }
  function stopTimer(){
    if(state.timerId){ clearInterval(state.timerId); state.timerId = null; }
  }

  // Motor: arranque de nivel
  function start(levelKey){
    const L = levels[levelKey];
    if(!L){ setHudState('Nivel no válido.'); return; }

    state.key = levelKey;
    state.cols = L.cols; state.rows = L.rows; state.mines = L.mines;
    state.running = true;
    state.time = 0;
    setHudLevel(L.label);
    setHudTimer(0);

    // Crear grid vacío
    state.grid = Array.from({ length: state.rows }, () =>
      Array.from({ length: state.cols }, () => ({
        revealed: false, mine: false, flag: false, num: 0
      }))
    );

    // Colocar minas
    let placed = 0;
    while(placed < state.mines){
      const x = Math.floor(Math.random() * state.cols);
      const y = Math.floor(Math.random() * state.rows);
      if(!state.grid[y][x].mine){
        state.grid[y][x].mine = true;
        placed++;
      }
    }

    // Calcular números
    for(let y=0;y<state.rows;y++){
      for(let x=0;x<state.cols;x++){
        if(state.grid[y][x].mine) continue;
        let c=0;
        for(let dy=-1;dy<=1;dy++){
          for(let dx=-1;dx<=1;dx++){
            const ny=y+dy, nx=x+dx;
            if(ny>=0 && ny<state.rows && nx>=0 && nx<state.cols && state.grid[ny][nx].mine) c++;
          }
        }
        state.grid[y][x].num = c;
      }
    }

    // Seguras
    state.safeLeft = state.cols * state.rows - state.mines;
    setHudSafe(state.safeLeft);

    // Render y timer
    renderBoard();
    btnReset.disabled = false;
    setHudState('¡Evita las minas y revela todas las seguras!');
    startTimer();
  }

  function reset(){
    if(!state.key) return;
    start(state.key);
    toast('Nivel reiniciado');
  }

  // Render tablero y bind eventos
  function renderBoard(){
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${state.cols}, var(--cell-size))`;
    for(let y=0;y<state.rows;y++){
      for(let x=0;x<state.cols;x++){
        const btn = document.createElement('button');
        btn.className = 'cell';
        btn.type = 'button';
        btn.dataset.x = x;
        btn.dataset.y = y;
        btn.setAttribute('aria-label', `Celda ${x+1},${y+1}`);
        btn.tabIndex = 0;

        btn.addEventListener('click', () => reveal(x,y));
        btn.addEventListener('contextmenu', (e) => { e.preventDefault(); toggleFlag(x,y); });

        boardEl.appendChild(btn);
      }
    }
  }

  function getBtn(x,y){
    return boardEl.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  }

  function reveal(x,y){
    if(!state.running) return;
    const c = state.grid[y][x];
    if(c.revealed || c.flag) return;

    c.revealed = true;
    const btn = getBtn(x,y);
    if(!btn) return;
    btn.classList.add('revealed');

    if(c.mine){
      btn.textContent = '💣';
      btn.classList.add('meme');
      gameOver(false);
      return;
    }

    state.safeLeft--;
    setHudSafe(state.safeLeft);

    if(c.num > 0){
      btn.textContent = c.num;
      btn.classList.add('n' + c.num);
    } else {
      btn.textContent = '';
      floodReveal(x,y);
    }

    if(state.safeLeft === 0){
      gameOver(true);
    }
  }

  function floodReveal(x,y){
    for(let dy=-1;dy<=1;dy++){
      for(let dx=-1;dx<=1;dx++){
        const nx=x+dx, ny=y+dy;
        if(nx<0 || ny<0 || nx>=state.cols || ny>=state.rows) continue;
        const c = state.grid[ny][nx];
        if(!c.revealed && !c.mine && !c.flag) reveal(nx,ny);
      }
    }
  }

  function toggleFlag(x,y){
    if(!state.running) return;
    const c = state.grid[y][x];
    if(c.revealed) return;
    c.flag = !c.flag;

    const btn = getBtn(x,y);
    if(!btn) return;
    btn.classList.toggle('flag', c.flag);
    btn.textContent = c.flag ? '⚑' : '';
  }

  function gameOver(victory){
    state.running = false;
    stopTimer();
    revealAll();
    setHudState(victory ? '¡Victoria! Todas las seguras reveladas.' : '¡Has encontrado una mina! Fin del juego.');
    // registrar partida (demo)
    try {
      const v = parseInt(localStorage.getItem('minijuegosJugados') || '0', 10) + 1;
      localStorage.setItem('minijuegosJugados', String(v));
    } catch {}
  }

  function revealAll(){
    for(let y=0;y<state.rows;y++){
      for(let x=0;x<state.cols;x++){
        const c = state.grid[y][x];
        const btn = getBtn(x,y);
        if(!btn) continue;
        btn.classList.add('revealed');
        if(c.mine){
          btn.textContent = '💣';
          btn.classList.add('meme');
        } else {
          btn.textContent = c.num > 0 ? c.num : '';
          if(c.num > 0) btn.classList.add('n' + c.num);
        }
      }
    }
  }

  // Exponer API pública
  window.Buscamines = { start, reset };
})();

