// js/buscamemes.js — Buscaminas Memeflix optimizado
(() => {
  const niveles = {
    facil: { cols: 9, rows: 9, memes: 10 },
    intermedio: { cols: 13, rows: 13, memes: 24 },
    sixseveeeen: { cols: 16, rows: 16, memes: 36 }
  };

  let tablero = [];
  let nivel = null;
  let timer = null;
  let tiempo = 0;
  let segurasRestantes = 0;
  let juegoActivo = false;

  const ui = window.BuscamemesUI || {};
  const elTablero = ui.tableroEl;
  const elEstado = ui.estadoEl;
  const elTimer = ui.timerEl;
  const elNivel = ui.nivelEl;
  const elSafe = ui.safeLeftEl;
  const btnReiniciar = ui.reiniciarBtn;

  function iniciarJuego(nombreNivel) {
    if (!niveles[nombreNivel]) return mostrarEstado('Nivel no válido.');
    nivel = niveles[nombreNivel];
    juegoActivo = true;
    tiempo = 0;
    clearInterval(timer);
    tablero = [];
    segurasRestantes = nivel.cols * nivel.rows - nivel.memes;
    elNivel.textContent = nombreNivel;
    elSafe.textContent = segurasRestantes;
    elTimer.textContent = '00:00';
    elEstado.textContent = '¡Juego iniciado! Revela las casillas sin memes.';
    btnReiniciar.disabled = false;

    generarTablero();
    renderizarTablero();
    iniciarCronometro();
  }

  function reiniciarNivel() {
    if (!nivel) return;
    iniciarJuego(Object.keys(niveles).find(k => niveles[k] === nivel));
  }

  function mostrarEstado(msg) {
    if (elEstado) elEstado.textContent = msg;
  }

  function iniciarCronometro() {
    timer = setInterval(() => {
      tiempo++;
      const min = String(Math.floor(tiempo / 60)).padStart(2, '0');
      const sec = String(tiempo % 60).padStart(2, '0');
      elTimer.textContent = `${min}:${sec}`;
    }, 1000);
  }

  function generarTablero() {
    const { cols, rows, memes } = nivel;
    tablero = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        revelada: false,
        meme: false,
        bandera: false,
        numero: 0
      }))
    );

    // Colocar memes aleatoriamente
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
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && tablero[ny][nx].meme) {
              count++;
            }
          }
        }
        tablero[y][x].numero = count;
      }
    }
  }

  function renderizarTablero() {
    const { cols, rows } = nivel;
    elTablero.innerHTML = '';
    elTablero.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const celda = document.createElement('button');
        celda.className = 'celda';
        celda.dataset.x = x;
        celda.dataset.y = y;
        celda.setAttribute('aria-label', `Celda ${x + 1},${y + 1}`);
        celda.tabIndex = 0;

        celda.addEventListener('click', () => revelar(x, y));
        celda.addEventListener('contextmenu', e => {
          e.preventDefault();
          marcarBandera(x, y);
        });

        elTablero.appendChild(celda);
      }
    }
  }

  function revelar(x, y) {
    if (!juegoActivo) return;
    const celda = tablero[y][x];
    if (celda.revelada || celda.bandera) return;

    celda.revelada = true;
    const btn = buscarBoton(x, y);
    if (!btn) return;

    btn.classList.add('revelada');
    if (celda.meme) {
      btn.textContent = '💣';
      mostrarEstado('¡Has encontrado un meme! Fin del juego.');
      juegoActivo = false;
      clearInterval(timer);
      revelarTodo();
      return;
    }

    segurasRestantes--;
    elSafe.textContent = segurasRestantes;
    btn.textContent = celda.numero > 0 ? celda.numero : '';
    if (celda.numero === 0) revelarVecinas(x, y);

    if (segurasRestantes === 0) {
      mostrarEstado('¡Has ganado! Todos los memes fueron evitados.');
      juegoActivo = false;
      clearInterval(timer);
    }
  }

  function revelarVecinas(x, y) {
    const { cols, rows } = nivel;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
          const vecina = tablero[ny][nx];
          if (!vecina.revelada && !vecina.meme && !vecina.bandera) {
            revelar(nx, ny);
          }
        }
      }
    }
  }

  function marcarBandera(x, y) {
    if (!juegoActivo) return;
    const celda = tablero[y][x];
    if (celda.revelada) return;

    celda.bandera = !celda.bandera;
    const btn = buscarBoton(x, y);
    if (!btn) return;

    btn.classList.toggle('flag');
    btn.textContent = celda.bandera ? '⚑' : '';
  }

  function buscarBoton(x, y) {
    return elTablero.querySelector(`.celda[data-x="${x}"][data-y="${y}"]`);
  }

  function revelarTodo() {
    const { cols, rows } = nivel;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const celda = tablero[y][x];
        const btn = buscarBoton(x, y);
        if (!btn || celda.revelada) continue;
        btn.classList.add('revelada');
        if (celda.meme) btn.textContent = '💣';
        else btn.textContent = celda.numero > 0 ? celda.numero : '';
      }
    }
  }

  // Exponer funciones globales para HTML
  window.iniciarJuego = iniciarJuego;
  window.reiniciarNivel = reiniciarNivel;
})();

