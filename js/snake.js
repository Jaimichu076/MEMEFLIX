// Snake mejorado Memeflix
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const CELL = 20;
let fps, snake, food, specialFood, score, level, usuario, record;
let running = false;

function init() {
  usuario = localStorage.getItem("usuarioMemeflix") || "Anónimo";
  record = JSON.parse(localStorage.getItem("snakeRecords")) || {};
  score = 0;
  level = 1;
  fps = 10;
  snake = [{x: canvas.width/2, y: canvas.height/2}];
  snake.dir = {x: CELL, y: 0};
  food = randomFood();
  specialFood = null;
  updateHUD();
}

function randomFood() {
  return {
    x: Math.floor(Math.random() * (canvas.width/CELL)) * CELL,
    y: Math.floor(Math.random() * (canvas.height/CELL)) * CELL
  };
}

function updateHUD() {
  document.getElementById("score").textContent = `Puntuación: ${score}`;
  document.getElementById("level").textContent = `Nivel: ${level}`;
  const best = record[usuario] || 0;
  document.getElementById("record").textContent = `Récord de ${usuario}: ${best}`;
}

function moveSnake() {
  const head = {x: snake[0].x + snake.dir.x, y: snake[0].y + snake.dir.y};
  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    food = randomFood();
    if (score % 50 === 0) specialFood = randomFood();
    if (score % 50 === 0) { level++; fps += 2; }
  } else if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
    score += 50;
    specialFood = null;
    level++;
    fps += 3;
  } else {
    snake.pop();
  }
}

function checkCollision() {
  const head = snake[0];
  if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) return true;
  for (let i=1; i<snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) return true;
  }
  return false;
}

function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Snake
  ctx.fillStyle = "#e50914";
  snake.forEach(seg => ctx.fillRect(seg.x, seg.y, CELL, CELL));

  // Food
  ctx.fillStyle = "lime";
  ctx.fillRect(food.x, food.y, CELL, CELL);

  // Special food
  if (specialFood) {
    ctx.fillStyle = "gold";
    ctx.fillRect(specialFood.x, specialFood.y, CELL, CELL);
  }
}

function gameLoop() {
  if (!running) return;
  moveSnake();
  if (checkCollision()) {
    if (!record[usuario] || score > record[usuario]) {
      record[usuario] = score;
      localStorage.setItem("snakeRecords", JSON.stringify(record));
    }
    document.getElementById("btnRestart").style.display = "inline-block";
    running = false;
    return;
  }
  draw();
  updateHUD();
  setTimeout(gameLoop, 1000/fps);
}

// Controles
document.addEventListener("keydown", e => {
  if (!running) return;
  if (e.key === "ArrowUp" && snake.dir.y === 0) snake.dir = {x:0,y:-CELL};
  if (e.key === "ArrowDown" && snake.dir.y === 0) snake.dir = {x:0,y:CELL};
  if (e.key === "ArrowLeft" && snake.dir.x === 0) snake.dir = {x:-CELL,y:0};
  if (e.key === "ArrowRight" && snake.dir.x === 0) snake.dir = {x:CELL,y:0};
});

// Botones
document.getElementById("btnStart").addEventListener("click", () => {
  init();
  running = true;
  document.getElementById("btnRestart").style.display = "none";
  gameLoop();
});

document.getElementById("btnRestart").addEventListener("click", () => {
  init();
  running = true;
  document.getElementById("btnRestart").style.display = "none";
  gameLoop();
});

// Inicializar HUD
init();
