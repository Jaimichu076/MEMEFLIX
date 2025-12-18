// js/buscamemes.js — Buscaminas Memeflix (mantenido y coherente con la UI)
(() => {
  const niveles = {
    facil: { cols: 9, rows: 9, memes: 10, label: 'Fácil' },
    intermedio: { cols: 13, rows: 13, memes: 24, label: 'Intermedio' },
    sixseveeeen: { cols: 16, rows: 16, memes: 36, label: 'Six Seveeeen' }
  };

  let tablero = [];
  let nivelKey = null;
  let timer = null;
  let tiempo = 0;
  let segurasRestantes = 0;
  let juegoActivo = false;

  const ui = window.BuscamemesUI || {};
  const elTablero = ui.tableroEl || document.getElementById('tablero');
  const elEstado = ui.estadoEl || document.getElementById('estado');
  const elTimer = ui.timerEl || document.getElementById('timer');
  const elNivel = ui.nivelEl || document.getElementById('nivelActual');
  const elSafe = ui.safeLeftEl || document.getElementById('safeLeft');
  const btnReiniciar = ui.reiniciarBtn || document.getElementById('btnReiniciar');

  function formatTimer(t){
    const min = String(Math.floor(t / 60)).padStart(2, '0');
    const sec = String(t % 60).padStart(2, '0');
    return `${min}:${sec}`;
  }

  function startTimer(){
    stopTimer();
    elTimer.textContent = '00:00';
    tiempo = 0;
    timer = setInterval(() => {
      if(!juegoActivo) return;
      tiempo++;
      elTimer.textContent = formatTimer(tiempo);
    }, 1000);
  }

  function stopTimer(){
    if(timer){ clearInterval(timer); timer = null; }
  }

  function iniciarJuego(key) {
    const nivel = niveles[key];
    if (!nivel) { setEstado('Nivel no válido.'); return; }
    nivelKey = key;
    juegoActivo = true;
    tiempo = 0;
    stopTimer();

    // Preparar tablero
    const { cols, rows, memes } = nivel;
    tablero = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        revelada: false,
        meme: false,
        bandera: false,
        numero: 0
      }))
    );

    // Colocar memes
    let colocados = 0;
    while (colocados < memes) {
      const x = Math.floor(Math.random() * cols);
      const y = Math.floor(Math.random() * rows);
      if (!tablero[y][x].meme) {
        tablero[y][x].meme = true;
        colocados++;
      }
    }

    // Calcular números
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (tablero[y][x].meme) continue;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy, nx = x + dx;
            if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && tablero[ny][nx].meme) count++;
          }
        }
        tablero[y][x].numero = count;
      }
    }

    // HUD
    segurasRestantes = cols * rows - memes;
    elSafe.textContent = segurasRestantes;
    elNivel.textContent = nivel.label;
    elTimer.textContent = '00:00';
    btnReiniciar.disabled = false;
    setEstado('¡Evita los memes y revela todas las seguras!');
    renderTablero(cols, rows);

    // Contador
    startTimer();
  }

  function reiniciarNivel() {
    if (!nivelKey) return;
    iniciarJuego(nivelKey);
    setEstado('Nivel reiniciado.');
  }

  function setEstado(msg){
    if(elEstado) elEstado.textContent = msg;
  }

  function renderTablero(cols, rows){
    elTablero.innerHTML = '';
    elTablero.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const celdaBtn = document.createElement('button');
        celdaBtn.className = 'celda';
        celdaBtn.type = 'button';
        celdaBtn.dataset.x = x;
        celdaBtn.dataset.y = y;
        celdaBtn.setAttribute('aria-label', `Celda ${x + 1},${y + 1}`);
        celdaBtn.tabIndex = 0;

        celdaBtn.addEventListener('click', () => revelar(x, y));
        celdaBtn.addEventListener('contextmenu', e => { e.preventDefault(); marcarBandera(x, y); });

        elTablero.appendChild(celdaBtn);
      }
    }
  }

  function revelar(x, y){
    if (!juegoActivo) return;
    const celda = tablero[y][x];
    if (celda.revelada || celda.bandera) return;
    celda.revelada = true;

    const btn = getBtn(x, y);
    if (!btn) return;
    btn.classList.add('revelada');

    if (celda.meme) {
      btn.textContent = '💣';
      juegoActivo = false;
      stopTimer();
      setEstado('¡Has encontrado un meme! Fin del juego.');
      revelarTodo();
      return;
    }

    segurasRestantes--;
    elSafe.textContent = segurasRestantes;
    btn.textContent = celda.numero > 0 ? celda.numero : '';
    if (celda.numero === 0) floodReveal(x, y);

    if (segurasRestantes === 0) {
      juegoActivo = false;
      stopTimer();
      setEstado('¡Victoria! Todas las seguras reveladas.');
      // registrar partida (demo)
      try {
        const v = parseInt(localStorage.getItem('minijuegosJugados') || '0', 10) + 1;
        localStorage.setItem('minijuegosJugados', String(v));
      } catch {}
    }
  }

  function floodReveal(x, y){
    const { rows, cols } = getSize();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const c = tablero[ny][nx];
        if (!c.revelada && !c.meme && !c.bandera) revelar(nx, ny);
      }
    }
  }

  function marcarBandera(x, y){
    if (!juegoActivo) return;
    const celda = tablero[y][x];
    if (celda.revelada) return;
    celda.bandera = !celda.bandera;

    const btn = getBtn(x, y);
    if (!btn) return;
    btn.classList.toggle('flag');
    btn.textContent = celda.bandera ? '⚑' : '';
  }

  function revelarTodo(){
    const { rows, cols } = getSize();
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const c = tablero[y][x];
        const b = getBtn(x, y);
        if (!b) continue;
        b.classList.add('revelada');
        b.textContent = c.meme ? '💣' : (c.numero > 0 ? c.numero : '');
      }
    }
  }

  function getBtn(x, y){
    return elTablero.querySelector(`.celda[data-x="${x}"][data-y="${y}"]`);
  }

  function getSize(){
    const n = niveles[nivelKey];
    return { rows: n.rows, cols: n.cols };
  }

  // Exponer funciones globales
  window.iniciarJuego = iniciarJuego;
  window.reiniciarNivel = reiniciarNivel;
})();


