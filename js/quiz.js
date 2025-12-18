const preguntas = [
  { pregunta: "¿Qué meme populariza 'Doge'?", opciones: ["Gato", "Perro Shiba Inu", "Pájaro", "Lagarto"], respuesta: 1 },
  { pregunta: "¿Qué significa 'sus' en Among Us?", opciones: ["Amigo", "Sospechoso", "Listo", "Lento"], respuesta: 1 }
];

let indice = 0;
let puntaje = 0;

function mostrarPregunta() {
  const q = preguntas[indice];
  document.getElementById("pregunta").textContent = q.pregunta;
  const opcionesDiv = document.getElementById("opciones");
  opcionesDiv.innerHTML = "";
  q.opciones.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.className = "btn btn-secondary m-2";
    btn.onclick = () => responder(i);
    opcionesDiv.appendChild(btn);
  });
}

function responder(i) {
  if (i === preguntas[indice].respuesta) puntaje += 10;
  indice++;
  if (indice < preguntas.length) {
    mostrarPregunta();
  } else {
    document.getElementById("pregunta").textContent = "Juego terminado";
    document.getElementById("opciones").innerHTML = `Puntaje: ${puntaje}`;
  }
}

window.onload = mostrarPregunta;

