// js/buscamemes.js - Buscamemes mejorado (asegúrate de enlazarlo en buscamemes.html)
(() => {
  const MEME_IMAGE = 'imagenes/sixseven.jpg'; // ruta relativa
  const tableroDiv = document.getElementById('tablero');
  const estadoDiv = document.getElementById('estado');
  const timerSpan = document.getElementById('timer');
  const safeLeftSpan = document.getElementById('safeLeft');
  const nivelActualSpan = document.getElementById('nivelActual');
  const btnReiniciar = document.getElementById('btnReiniciar');
  const btnFacil = document.getElementById('btnFacil');
  const btnIntermedio = document.getElementById('btnIntermedio');
  const btnSix = document.getElementById('btnSix');

  let filas=0, columnas=0, numMinas=0;
  let nivel=null, grid=[], reveladasSeguras=0, terminado=false, primerClickHecho=false;
  let startTime=null, timerInterval=null;

  function cargarProgreso(){ return localStorage.getItem('buscamemesProgreso') || 'facil'; }
  function guardarProgreso(v){ localStorage.setItem('buscamemesProgreso', v); }

  function actualizarBloqueos(){
    const progreso = cargarProgreso();
    btnFacil.disabled = false;
    btnIntermedio.disabled = progreso === 'facil';
    btnSix.disabled = progreso !== 'sixseveeeen';
  }

  function formatTime(ms){
    const s = Math.floor(ms/1000);
    const mm = String(Math.floor(s/60)).padStart(2,'0');
    const ss = String(s%60).padStart(2,'0');
    return `${mm}:${ss}`;
  }
  function startTimer(){
    stopTimer();
    startTime = Date.now();
    timerInterval = setInterval(()=> timerSpan.textContent = formatTime(Date.now()-startTime), 200);
  }
  function stopTimer(){ if(timerInterval){ clearInterval(timerInterval); timerInterval=null; } }

  window.iniciarJuego = function(nivelSeleccionado){
    const progreso = cargarProgreso();
    if(nivelSeleccionado === 'intermedio' && progreso === 'facil'){ estadoDiv.textContent = 'Debes ganar Fácil para desbloquear Intermedio.'; return; }
    if(nivelSeleccionado === 'sixseveeeen' && progreso !== 'sixseveeeen' && progreso !== 'intermedio'){ estadoDiv.textContent = 'Debes ganar Intermedio para desbloquear Six Seveeeen.'; return; }
    configurarNivel(nivelSeleccionado);
    nuevaPartida();
    nivelActualSpan.textContent = nivelLabel(nivelSeleccionado);
    estadoDiv.textContent = '¡En marcha! Clic izquierdo: revelar | Clic derecho: bandera';
    btnReiniciar.disabled = false;
    startTimer();
  };

  function configurarNivel(n){
    nivel = n;
    if(n === 'facil'){ filas=8; columnas=8; numMinas=10; document.documentElement.style.setProperty('--cell-size','40px'); }
    else if(n === 'intermedio'){ filas=12; columnas=12; numMinas=20; document.documentElement.style.setProperty('--cell-size','36px'); }
    else if(n === 'sixseveeeen'){ filas=20; columnas=20; numMinas=60; document.documentElement.style.setProperty('--cell-size','28px'); }
  }

  function nuevaPartida(){
    terminado=false; primerClickHecho=false; reveladasSeguras=0; timerSpan.textContent='00:00';
    construirGridVacio();
    renderTablero();
    actualizarHUD();
  }

  function construirGridVacio(){
    grid = Array.from({length:filas}, ()=> Array.from({length:columnas}, ()=> ({mine:false,number:0,revealed:false,flagged:false})));
  }

  function plantarMinasNumerosAleatorio(excluirCoord=null, expandir=false){
    // coloca minas evitando excluirCoord y vecinos
    let colocadas=0;
    while(colocadas < numMinas){
      const f = Math.floor(Math.random()*filas);
      const c = Math.floor(Math.random()*columnas);
      if(excluirCoord && Math.abs(f-excluirCoord.f)<=1 && Math.abs(c-excluirCoord.c)<=1) continue;
      if(grid[f][c].mine) continue;
      grid[f][c].mine = true; colocadas++;
    }
    // calcular números
    for(let f=0; f<filas; f++){
      for(let c=0; c<columnas; c++){
        if(grid[f][c].mine){ grid[f][c].number = 0; continue; }
        grid[f][c].number = contarMinasVecinas(f,c);
      }
    }
    if(expandir && excluirCoord){
      revelarCelda(excluirCoord.f, excluirCoord.c);
      if(grid[excluirCoord.f][excluirCoord.c].number === 0) expandirCeros(excluirCoord.f, excluirCoord.c);
    }
  }

  function contarMinasVecinas(f,c){
    let count=0;
    for(let df=-1; df<=1; df++){
      for(let dc=-1; dc<=1; dc++){
        if(df===0 && dc===0) continue;
        const nf=f+df, nc=c+dc;
        if(nf>=0 && nf<filas && nc>=0 && nc<columnas && grid[nf][nc].mine) count++;
      }
    }
    return count;
  }

  function renderTablero(){
    tableroDiv.style.gridTemplateColumns = `repeat(${columnas}, var(--cell-size))`;
    tableroDiv.innerHTML = '';
    for(let f=0; f<filas; f++){
      for(let c=0; c<columnas; c++){
        const celda = document.createElement('div');
        celda.className = 'celda';
        celda.dataset.f = f; celda.dataset.c = c;
        celda.addEventListener('click', onLeftClick);
        celda.addEventListener('contextmenu', e=>{ e.preventDefault(); onRightClick(celda); });
        tableroDiv.appendChild(celda);
      }
    }
  }

  function onLeftClick(e){
    if(terminado) return;
    const celda = e.currentTarget;
    const f = parseInt(celda.dataset.f,10), c = parseInt(celda.dataset.c,10);
    const cell = grid[f][c];
    if(cell.revealed || cell.flagged) return;

    if(!primerClickHecho){
      primerClickHecho = true;
      construirGridVacio();
      plantarMinasNumerosAleatorio({f,c}, true);
      startTimer();
    }
    revelarCelda(f,c);
    comprobarVictoria();
    actualizarHUD();
  }

  function onRightClick(celda){
    if(terminado) return;
    const f = parseInt(celda.dataset.f,10), c = parseInt(celda.dataset.c,10);
    const cell = grid[f][c];
    if(cell.revealed) return;
    cell.flagged = !cell.flagged;
    dibujarCelda(f,c);
  }

  function revelarCelda(f,c){
    const cell = grid[f][c];
    if(cell.revealed || cell.flagged) return;
    cell.revealed = true;
    dibujarCelda(f,c);
    if(cell.mine){ finDePartida(false); return; }
    reveladasSeguras++;
    if(cell.number === 0) expandirCeros(f,c);
  }

  function expandirCeros(f,c){
    const stack = [[f,c]];
    while(stack.length){
      const [rf,rc] = stack.pop();
      for(let df=-1; df<=1; df++){
        for(let dc=-1; dc<=1; dc++){
          const nf = rf+df, nc = rc+dc;
          if(nf<0 || nf>=filas || nc<0 || nc>=columnas) continue;
          const ncell = grid[nf][nc];
          if(ncell.revealed || ncell.flagged || ncell.mine) continue;
          ncell.revealed = true;
          dibujarCelda(nf,nc);
          reveladasSeguras++;
          if(ncell.number === 0) stack.push([nf,nc]);
        }
      }
    }
  }

  function dibujarCelda(f,c){
    const idx = f*columnas + c;
    const div = tableroDiv.children[idx];
    const cell = grid[f][c];
    div.className = 'celda';
    div.style.backgroundImage = '';
    div.textContent = '';
    if(cell.revealed){
      div.classList.add('revelada');
      if(cell.mine){
        div.classList.add('meme');
        div.style.backgroundImage = `url("${MEME_IMAGE}")`;
      } else if(cell.number > 0){
        div.textContent = cell.number;
        div.style.color = colorNumero(cell.number);
        div.style.fontWeight = '700';
      }
    } else {
      if(cell.flagged){
        div.textContent = '⚑';
        div.style.color = '#e50914';
        div.style.fontWeight = '900';
      } else {
        div.textContent = '';
      }
    }
  }

  function colorNumero(n){
    switch(n){
      case 1: return '#3fa7f3';
      case 2: return '#3fbf6f';
      case 3: return '#f44336';
      case 4: return '#7e57c2';
      case 5: return '#795548';
      case 6: return '#26a69a';
      case 7: return '#c0ca33';
      case 8: return '#9e9e9e';
      default: return '#fff';
    }
  }

  function comprobarVictoria(){
    const segurasTotal = filas*columnas - numMinas;
    if(reveladasSeguras >= segurasTotal) finDePartida(true);
  }

  function finDePartida(victoria){
    terminado = true;
    stopTimer();
    mostrarTodo();
    const tiempo = startTime ? formatTime(Date.now()-startTime) : '00:00';
    if(victoria){
      estadoDiv.textContent = `¡Has ganado! Tiempo: ${tiempo}`;
      const progreso = cargarProgreso();
      if(nivel === 'facil' && progreso === 'facil') guardarProgreso('intermedio');
      else if(nivel === 'intermedio' && progreso !== 'sixseveeeen') guardarProgreso('sixseveeeen');
      actualizarBloqueos();
    } else {
      estadoDiv.textContent = `Has pisado un meme. Tiempo: ${tiempo}`;
    }
  }

  function mostrarTodo(){
    for(let f=0; f<filas; f++){
      for(let c=0; c<columnas; c++){
        grid[f][c].revealed = true;
        dibujarCelda(f,c);
      }
    }
  }

  function actualizarHUD(){
    const segurasTotal = filas*columnas - numMinas;
    safeLeftSpan.textContent = Math.max(segurasTotal - reveladasSeguras, 0);
  }

  window.reiniciarNivel = function(){
    if(!nivel) return;
    nuevaPartida();
    estadoDiv.textContent = 'Nivel reiniciado. ¡Suerte!';
    startTimer();
  };

  // Inicialización UI
  actualizarBloqueos();
  estadoDiv.textContent = 'Selecciona un nivel para comenzar.';
  timerSpan.textContent = '00:00';
  safeLeftSpan.textContent = '-';
  nivelActualSpan.textContent = '-';

})();
