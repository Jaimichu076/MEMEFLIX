// js/quiz.js
(() => {
  const questions = [
    {
      q: '¿En qué año se lanzó la primera versión de Snake en teléfonos Nokia?',
      choices: ['1997', '1998', '1999', '2000'],
      a: 1
    },
    {
      q: '¿Qué tecla se usa comúnmente para pausar un juego en PC?',
      choices: ['P', 'Esc', 'Space', 'Enter'],
      a: 1
    },
    {
      q: '¿Cuál de estos no es un lenguaje de programación?',
      choices: ['Python', 'HTML', 'JavaScript', 'Ruby'],
      a: 1
    },
    {
      q: '¿Qué significa UX?',
      choices: ['User Experience', 'User Xchange', 'Universal Experience', 'User Execute'],
      a: 0
    },
    {
      q: '¿Qué color es el acento principal en Memeflix?',
      choices: ['Verde', 'Azul', 'Rojo', 'Amarillo'],
      a: 2
    }
  ];

  const TIME_PER_QUESTION = 20; // segundos
  const quizCard = document.getElementById('quizCard');
  const questionTitle = document.getElementById('questionTitle');
  const questionText = document.getElementById('questionText');
  const choicesEl = document.getElementById('choices');
  const timerEl = document.getElementById('timer');
  const btnNext = document.getElementById('btnNext');
  const btnQuit = document.getElementById('btnQuit');
  const scoreEl = document.getElementById('score');

  let index = 0;
  let score = 0;
  let timer = null;
  let timeLeft = TIME_PER_QUESTION;
  let answered = false;
  let shuffled = [];

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function startQuiz() {
    shuffled = shuffleArray(questions);
    index = 0;
    score = 0;
    scoreEl.textContent = score;
    loadQuestion();
  }

  function loadQuestion() {
    clearInterval(timer);
    answered = false;
    btnNext.disabled = true;
    const item = shuffled[index];
    questionTitle.textContent = `Pregunta ${index + 1} / ${shuffled.length}`;
    questionText.textContent = item.q;
    // shuffle choices but keep track of correct index
    const choices = item.choices.map((c, i) => ({ c, i }));
    const shuffledChoices = shuffleArray(choices);
    choicesEl.innerHTML = '';
    shuffledChoices.forEach((ch, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.type = 'button';
      btn.textContent = ch.c;
      btn.dataset.origIndex = ch.i;
      btn.addEventListener('click', onChoice);
      choicesEl.appendChild(btn);
    });
    timeLeft = TIME_PER_QUESTION;
    timerEl.textContent = String(timeLeft).padStart(2, '0');
    timer = setInterval(() => {
      timeLeft--;
      timerEl.textContent = String(timeLeft).padStart(2, '0');
      if (timeLeft <= 0) {
        clearInterval(timer);
        revealAnswer(null);
      }
    }, 1000);
  }

  function onChoice(e) {
    if (answered) return;
    answered = true;
    const btn = e.currentTarget;
    const chosenIndex = parseInt(btn.dataset.origIndex, 10);
    revealAnswer(chosenIndex, btn);
  }

  function revealAnswer(chosenIndex, btnEl = null) {
    clearInterval(timer);
    const item = shuffled[index];
    const correctIndex = item.a;
    // mark choices
    Array.from(choicesEl.children).forEach(ch => {
      const orig = parseInt(ch.dataset.origIndex, 10);
      ch.classList.remove('correct', 'wrong');
      ch.disabled = true;
      if (orig === correctIndex) ch.classList.add('correct');
      if (chosenIndex !== null && orig === chosenIndex && orig !== correctIndex) ch.classList.add('wrong');
    });
    // scoring: remaining time bonus
    if (chosenIndex === correctIndex) {
      const gained = 10 + Math.max(0, timeLeft);
      score += gained;
      scoreEl.textContent = score;
    }
    btnNext.disabled = false;
  }

  btnNext.addEventListener('click', () => {
    index++;
    if (index >= shuffled.length) {
      endQuiz();
    } else {
      loadQuestion();
    }
  });

  btnQuit.addEventListener('click', () => {
    if (!confirm('Salir del quiz y perder la puntuación actual?')) return;
    endQuiz(true);
  });

  function endQuiz(skipSave = false) {
    clearInterval(timer);
    // save top scores in localStorage
    if (!skipSave) {
      const top = JSON.parse(localStorage.getItem('quizTop') || '[]');
      top.push({ score, ts: Date.now() });
      top.sort((a, b) => b.score - a.score);
      if (top.length > 10) top.length = 10;
      localStorage.setItem('quizTop', JSON.stringify(top));
    }
    // show summary
    quizCard.innerHTML = `
      <div style="text-align:center">
        <h2 style="color:var(--accent-red)">Resultado</h2>
        <p class="small">Puntuación final: <strong>${score}</strong></p>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
          <button id="btnPlayAgain" class="btn">Jugar otra vez</button>
          <a href="../minijuegos.html" class="btn ghost">Volver a Minijuegos</a>
        </div>
        <div style="margin-top:12px" class="small">Mejores puntuaciones guardadas localmente.</div>
        <div id="topList" style="margin-top:12px"></div>
      </div>
    `;
    const btnPlayAgain = document.getElementById('btnPlayAgain');
    btnPlayAgain.addEventListener('click', () => {
      location.reload();
    });
    renderTop();
  }

  function renderTop() {
    const top = JSON.parse(localStorage.getItem('quizTop') || '[]');
    const topList = document.getElementById('topList');
    if (!topList) return;
    if (top.length === 0) {
      topList.innerHTML = '<div class="small">No hay puntuaciones aún.</div>';
      return;
    }
    topList.innerHTML = '<ol>' + top.map(t => `<li>${t.score} pts · ${new Date(t.ts).toLocaleString('es-ES')}</li>`).join('') + '</ol>';
  }

  // initialize
  startQuiz();

  // accessibility: keyboard navigation for choices
  choicesEl.addEventListener('keydown', e => {
    const focusable = Array.from(choicesEl.querySelectorAll('.choice'));
    const idx = focusable.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = focusable[(idx + 1) % focusable.length];
      next && next.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = focusable[(idx - 1 + focusable.length) % focusable.length];
      prev && prev.focus();
    }
  });

})();
