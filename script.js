// ==========================================================
// CONFIGURACIÓN GENERAL
// ==========================================================

const G = 9.8;

const COLOR_AZUL = "#0B2D5B";
const COLOR_VERDE = "#E9F8E9";

const problemaSelect = document.getElementById("problema");
const descripcionLabel = document.getElementById("descripcion-label");
const frameInputs = document.getElementById("frame-inputs");
const formulario = document.getElementById("formulario");
const notaLabel = document.getElementById("nota-label");
const resultadoText = document.getElementById("resultado-text");
const botonPausar = document.getElementById("boton-pausar");
const botonReiniciar = document.getElementById("boton-reiniciar");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let entradas = {};
let animacionId = null;
let pausado = false;
let animacionActual = null;

// ==========================================================
// FUNCIONES GENERALES
// ==========================================================

function limpiarTodo() {
  if (animacionId) {
    cancelAnimationFrame(animacionId);
    animacionId = null;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  resultadoText.value = "";
}

function limpiarSoloAnimacion() {
  if (animacionId) {
    cancelAnimationFrame(animacionId);
    animacionId = null;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function obtenerFloat(nombre, etiqueta) {
  const valor = Number.parseFloat(entradas[nombre].value);

  if (Number.isNaN(valor)) {
    alert(`Ingresa un número válido para ${etiqueta}.`);
    return null;
  }

  return valor;
}

function pausarReanudar() {
  pausado = !pausado;

  if (pausado) {
    botonPausar.textContent = "▶ CONTINUAR";
  } else {
    botonPausar.textContent = "⏸ PAUSAR";
  }
}

function reiniciar() {
  calcular();
}

function escribir(texto) {
  resultadoText.value += texto;
}

function crearInput(nombre, texto, valorDefault) {
  const row = document.createElement("div");
  row.className = "input-row";

  const label = document.createElement("label");
  label.textContent = texto;

  const input = document.createElement("input");
  input.type = "number";
  input.step = "any";
  input.value = valorDefault;

  row.appendChild(label);
  row.appendChild(input);
  frameInputs.appendChild(row);

  entradas[nombre] = input;
}

function actualizarCampos() {
  pausado = false;
  botonPausar.textContent = "⏸ PAUSAR";
  limpiarTodo();

  frameInputs.innerHTML = "";
  entradas = {};

  if (problemaSelect.value === "atwood") {
    descripcionLabel.textContent =
      "Introduce los valores de las masas para calcular la aceleración del sistema y la tensión de la cuerda. La gravedad se usará como 9.8 m/s².";

    crearInput("m1", "Masa 1 (m₁) [kg]:", "150");
    crearInput("m2", "Masa 2 (m₂) [kg]:", "250");

    notaLabel.textContent =
      "Nota:\nEn la máquina de Atwood, la masa mayor desciende y la masa menor asciende.";
  } else {
    descripcionLabel.textContent =
      "Introduce los valores para calcular la aceleración de la caja. La persona aplica una fuerza y existe fricción en sentido contrario. La gravedad se usará como 9.8 m/s².";

    crearInput("F", "Fuerza aplicada (F) [N]:", "300");
    crearInput("m", "Masa de la caja (m) [kg]:", "100");
    crearInput("mu", "Coef. de fricción (μ):", "0.20");

    notaLabel.textContent =
      "Nota:\nLa persona ejerce una fuerza sobre la caja hacia la derecha. Por tercera ley, la caja ejerce una fuerza igual y contraria sobre la persona.";
  }

  calcular();
}

// ==========================================================
// DIBUJO BASE
// ==========================================================

function rect(x, y, w, h, fill, stroke = "black", lineWidth = 1) {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function oval(x, y, w, h, fill, stroke = "black", lineWidth = 1) {
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function line(x1, y1, x2, y2, color = "black", lineWidth = 1) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function text(x, y, contenido, font = "10px Arial", color = "black", align = "center") {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(contenido, x, y);
}

function arrow(x1, y1, x2, y2, color = "black", lineWidth = 1) {
  const headLength = 12;
  const angle = Math.atan2(y2 - y1, x2 - x1);

  line(x1, y1, x2, y2, color, lineWidth);

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 6),
    y2 - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 6),
    y2 - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// ==========================================================
// CÁLCULOS
// ==========================================================

function calcular() {
  pausado = false;
  botonPausar.textContent = "⏸ PAUSAR";

  if (problemaSelect.value === "atwood") {
    calcularAtwood();
  } else {
    calcularCaja();
  }
}

function calcularAtwood() {
  const m1 = obtenerFloat("m1", "masa 1");
  const m2 = obtenerFloat("m2", "masa 2");
  const g = G;

  if (m1 === null || m2 === null) return;

  if (m1 <= 0 || m2 <= 0) {
    alert("Las masas deben ser mayores que 0.");
    return;
  }

  let aceleracion;
  let tension;

  if (m1 === m2) {
    aceleracion = 0;
    tension = m1 * g;
  } else {
    aceleracion = Math.abs(((m2 - m1) * g) / (m1 + m2));

    if (m2 > m1) {
      tension = m1 * (g + aceleracion);
    } else {
      tension = m2 * (g + aceleracion);
    }
  }

  resultadoText.value = "";

  escribir("PROBLEMA ESCRITO:\n");
  escribir(
    "En una máquina de Atwood, dos masas están conectadas por una cuerda que pasa sobre una polea ideal. La masa mayor hará que el sistema se mueva, provocando que una masa baje y la otra suba.\n\n"
  );

  escribir("PREGUNTAS A CALCULAR:\n");
  escribir("1. ¿Cuál es la aceleración del sistema?\n");
  escribir("2. ¿Cuál es la tensión en la cuerda?\n\n");

  escribir("DATOS INGRESADOS:\n");
  escribir(`m₁ = ${m1} kg\n`);
  escribir(`m₂ = ${m2} kg\n`);
  escribir(`g = ${g} m/s²\n\n`);

  escribir("PROCEDIMIENTO:\n\n");

  escribir("1. Fórmula de aceleración:\n");
  escribir("a = ((masa mayor - masa menor)g) / (m₁ + m₂)\n\n");

  escribir("2. Sustitución:\n");
  escribir(`a = ((${Math.max(m1, m2)} - ${Math.min(m1, m2)})(${g})) / (${m1} + ${m2})\n`);
  escribir(`a = ${aceleracion.toFixed(3)} m/s²\n\n`);

  escribir("3. Fórmula de tensión:\n");

  if (m1 === m2) {
    escribir("T = mg\n");
    escribir(`T = (${m1})(${g})\n`);
  } else {
    escribir("T = masa menor (g + a)\n");
    escribir(`T = ${Math.min(m1, m2)}(${g} + ${aceleracion.toFixed(3)})\n`);
  }

  escribir(`T = ${tension.toFixed(3)} N\n\n`);

  escribir("RESPUESTA FINAL:\n");
  escribir(`Aceleración del sistema: ${aceleracion.toFixed(3)} m/s²\n`);
  escribir(`Tensión en la cuerda: ${tension.toFixed(3)} N\n\n`);

  if (m2 > m1) {
    escribir("Dirección del movimiento:\nm₂ desciende y m₁ asciende.");
  } else if (m1 > m2) {
    escribir("Dirección del movimiento:\nm₁ desciende y m₂ asciende.");
  } else {
    escribir("Dirección del movimiento:\nEl sistema está en equilibrio.");
  }

  animarAtwood(m1, m2, aceleracion);
}

function calcularCaja() {
  const F = obtenerFloat("F", "fuerza aplicada");
  const m = obtenerFloat("m", "masa");
  const mu = obtenerFloat("mu", "coeficiente de fricción");
  const g = G;

  if (F === null || m === null || mu === null) return;

  if (F <= 0 || m <= 0 || mu < 0) {
    alert("Revisa los valores. Fuerza y masa deben ser mayores a 0.");
    return;
  }

  const normal = m * g;
  const friccion = mu * normal;
  const fuerzaNeta = F - friccion;
  const aceleracion = fuerzaNeta / m;

  resultadoText.value = "";

  escribir("PROBLEMA ESCRITO:\n");
  escribir(
    "Una persona empuja una caja sobre una superficie horizontal. La persona aplica una fuerza hacia la derecha, mientras que la fricción actúa en sentido contrario. Según la tercera ley de Newton, la caja también ejerce una fuerza de reacción sobre la persona.\n\n"
  );

  escribir("PREGUNTAS A CALCULAR:\n");
  escribir("1. ¿Cuál es la fuerza de fricción?\n");
  escribir("2. ¿Cuál es la fuerza neta?\n");
  escribir("3. ¿Cuál es la aceleración de la caja?\n");
  escribir("4. ¿Cuál es la fuerza de reacción sobre la persona?\n\n");

  escribir("DATOS INGRESADOS:\n");
  escribir(`F aplicada = ${F} N\n`);
  escribir(`m = ${m} kg\n`);
  escribir(`μ = ${mu}\n`);
  escribir(`g = ${g} m/s²\n\n`);

  escribir("PROCEDIMIENTO:\n\n");

  escribir("1. Calcular la fuerza normal:\n");
  escribir("N = mg\n");
  escribir(`N = (${m})(${g})\n`);
  escribir(`N = ${normal.toFixed(3)} N\n\n`);

  escribir("2. Calcular la fuerza de fricción:\n");
  escribir("Ff = μN\n");
  escribir(`Ff = (${mu})(${normal.toFixed(3)})\n`);
  escribir(`Ff = ${friccion.toFixed(3)} N\n\n`);

  escribir("3. Calcular la fuerza neta:\n");
  escribir("Fneta = F aplicada - F fricción\n");
  escribir(`Fneta = ${F} - ${friccion.toFixed(3)}\n`);
  escribir(`Fneta = ${fuerzaNeta.toFixed(3)} N\n\n`);

  escribir("4. Calcular la aceleración:\n");
  escribir("a = Fneta / m\n");
  escribir(`a = ${fuerzaNeta.toFixed(3)} / ${m}\n`);
  escribir(`a = ${aceleracion.toFixed(3)} m/s²\n\n`);

  escribir("5. Tercera Ley de Newton:\n");
  escribir("F acción = -F reacción\n");
  escribir(
    `Si la persona empuja la caja con ${F.toFixed(3)} N hacia la derecha,\n` +
    `la caja empuja a la persona con ${F.toFixed(3)} N hacia la izquierda.\n\n`
  );

  escribir("RESPUESTA FINAL:\n");
  escribir(`Fuerza de fricción: ${friccion.toFixed(3)} N\n`);
  escribir(`Fuerza neta: ${fuerzaNeta.toFixed(3)} N\n`);
  escribir(`Aceleración de la caja: ${aceleracion.toFixed(3)} m/s²\n`);
  escribir(`Fuerza de reacción: ${F.toFixed(3)} N en sentido contrario\n`);

  animarCaja(F, friccion, fuerzaNeta, aceleracion);
}

// ==========================================================
// ANIMACIÓN ATWOOD
// ==========================================================

function dibujarAtwoodBase(m1, m2, aceleracion, offset) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  rect(155, 35, 250, 10, "#8E8E8E", "black");
  rect(275, 45, 10, 50, "#555555", "black");

  oval(225, 85, 110, 110, "#D7E1E5", "black", 3);
  ctx.beginPath();
  ctx.ellipse(280, 140, 45, 45, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "#7A8B8F";
  ctx.lineWidth = 2;
  ctx.stroke();

  oval(274, 134, 12, 12, "#555555", "black");

  ctx.beginPath();
  ctx.arc(280, 140, 55, Math.PI, 0);
  ctx.strokeStyle = "#C47A00";
  ctx.lineWidth = 4;
  ctx.stroke();

  const x1 = 225;
  const x2 = 335;
  const yInicial = 215;

  let direccion = 0;

  if (m1 > m2) {
    arrow(135, 225, 135, 290, "#1B4F9C", 4);
    text(135, 205, "m₁ baja", "bold 10px Arial", "#1B4F9C");

    arrow(425, 290, 425, 225, "#1B7F2A", 4);
    text(425, 205, "m₂ sube", "bold 10px Arial", "#1B7F2A");

    direccion = 1;
  } else if (m2 > m1) {
    arrow(135, 290, 135, 225, "#1B4F9C", 4);
    text(135, 205, "m₁ sube", "bold 10px Arial", "#1B4F9C");

    arrow(425, 225, 425, 290, "#1B7F2A", 4);
    text(425, 205, "m₂ baja", "bold 10px Arial", "#1B7F2A");

    direccion = -1;
  } else {
    text(280, 360, "m₁ = m₂ → Sistema en equilibrio", "bold 14px Arial");
    return;
  }

  const y1 = yInicial + direccion * offset;
  const y2 = yInicial - direccion * offset;

  line(x1, 140, x1, y1, "#C47A00", 4);
  line(x2, 140, x2, y2, "#C47A00", 4);

  rect(x1 - 45, y1, 90, 75, "#A7D8F0", "black");
  text(x1, y1 + 28, "m₁", "bold 14px Arial");
  text(x1, y1 + 52, `${m1} kg`, "10px Arial");

  rect(x2 - 45, y2, 90, 75, "#9EF09E", "black");
  text(x2, y2 + 28, "m₂", "bold 14px Arial");
  text(x2, y2 + 52, `${m2} kg`, "10px Arial");

  rect(100, 365, 360, 35, COLOR_VERDE, "#75B975");
  text(280, 382, `Aceleración del sistema: ${aceleracion.toFixed(3)} m/s²`, "bold 12px Arial");
}

function animarAtwood(m1, m2, aceleracion) {
  limpiarSoloAnimacion();

  let desplazamiento = 0;
  let direccionLoop = 1;

  if (m1 === m2) {
    dibujarAtwoodBase(m1, m2, aceleracion, 0);
    return;
  }

  function mover() {
    if (!pausado) {
      desplazamiento += 1.5 * direccionLoop;

      if (desplazamiento > 65) {
        desplazamiento = 0;
      }
    }

    dibujarAtwoodBase(m1, m2, aceleracion, desplazamiento);
    animacionId = requestAnimationFrame(mover);
  }

  mover();
}

// ==========================================================
// ANIMACIÓN CAJA
// ==========================================================

function dibujarCajaBase(F, friccion, fuerzaNeta, aceleracion, offset) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  rect(0, 320, 560, 30, "#A9A9A9", null);

  const dx = offset;

  // Persona simple
  oval(85 + dx, 150, 35, 35, "#F2C49B", "black");
  line(103 + dx, 185, 130 + dx, 240, "#2E7D32", 6);
  line(130 + dx, 240, 95 + dx, 310, "#123C69", 6);
  line(130 + dx, 240, 155 + dx, 310, "#123C69", 6);
  line(110 + dx, 200, 190 + dx, 220, "#F2C49B", 5);
  line(95 + dx, 310, 75 + dx, 310, "black", 5);
  line(155 + dx, 310, 180 + dx, 310, "black", 5);

  // Caja
  rect(190 + dx, 210, 140, 110, "#B8793D", "black", 2);
  line(190 + dx, 210, 330 + dx, 320, "#7A4B22", 3);
  line(330 + dx, 210, 190 + dx, 320, "#7A4B22", 3);
  text(260 + dx, 265, "CAJA", "bold 13px Arial");

  // Flecha fuerza aplicada
  arrow(200, 175, 350, 175, "green", 5);
  text(275, 150, `F aplicada = ${F.toFixed(1)} N`, "bold 11px Arial");

  // Flecha fricción
  arrow(320, 340, 190, 340, "red", 5);
  text(255, 370, `F fricción = ${friccion.toFixed(1)} N`, "bold 11px Arial");

  // Reacción sobre persona
  arrow(185, 235, 125, 235, "#B00020", 4);
  text(155, 255, "Reacción", "bold 10px Arial", "#B00020");

  rect(90, 390, 380, 35, COLOR_VERDE, "#75B975");
  text(280, 407, `F neta = ${fuerzaNeta.toFixed(2)} N   →   a = ${aceleracion.toFixed(3)} m/s²`, "bold 11px Arial");
}

function animarCaja(F, friccion, fuerzaNeta, aceleracion) {
  limpiarSoloAnimacion();

  const direccion = fuerzaNeta > 0 ? 1 : fuerzaNeta < 0 ? -1 : 0;
  let desplazamiento = 0;

  function mover() {
    if (!pausado && direccion !== 0) {
      desplazamiento += 1.3;

      if (desplazamiento > 60) {
        desplazamiento = 0;
      }
    }

    dibujarCajaBase(F, friccion, fuerzaNeta, aceleracion, direccion * desplazamiento);
    animacionId = requestAnimationFrame(mover);
  }

  mover();
}

// ==========================================================
// EVENTOS E INICIO
// ==========================================================

problemaSelect.addEventListener("change", actualizarCampos);

formulario.addEventListener("submit", function (event) {
  event.preventDefault();
  calcular();
});

botonPausar.addEventListener("click", pausarReanudar);
botonReiniciar.addEventListener("click", reiniciar);

actualizarCampos();
