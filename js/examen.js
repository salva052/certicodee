// =========================
// 1) Guardia de sesión
// =========================
const token = localStorage.getItem("token");
if (!token) {
  mostrarMensaje("Debes iniciar sesión antes de hacer el examen.", "error");
  window.location.href = "index.html";
}

// =========================
// 2) Si ya hizo el examen (por usuario), no lo dejamos entrar
// =========================
const usuarioActual = localStorage.getItem("nombre") || "anonimo";
if (localStorage.getItem(`examenRealizado_${usuarioActual}`) === "true") {
  mostrarMensaje("Ya realizaste este examen, no puedes volver a hacerlo.", "error");
  window.location.href = "certificaciones.html";
}

// =========================
// 3) Referencias del DOM
// =========================
const contenedor = document.getElementById("preguntas");
const resultado = document.getElementById("resultado");
const btnEnviar = document.getElementById("btnEnviar");

// Seguridad inicial
if (btnEnviar) {
  btnEnviar.disabled = true;
  btnEnviar.textContent = "Enviar Examen";
}

// Estado
let examen = [];
let examenComenzado = false;

// =========================
//   TEMPORIZADOR (5 min, fluido)
// =========================
function iniciarTemporizador(temporizadorElemento) {
  const tiempoTotal = 5 * 60 * 1000; // 5 minutos
  const inicio = performance.now();
  let terminado = false;

  function actualizar() {
    if (terminado) return;

    const ahora = performance.now();
    const transcurrido = ahora - inicio;
    const restante = Math.max(0, tiempoTotal - transcurrido);

    const minutos = Math.floor(restante / 60000);
    const segundos = Math.floor((restante % 60000) / 1000);

    temporizadorElemento.textContent = `Tiempo restante: ${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;

    if (restante <= 60000 && !terminado) {
      temporizadorElemento.style.color = "#ff0000";
      temporizadorElemento.style.animation = "parpadeo 1s infinite";
    }

    if (restante <= 0 && !terminado) {
      terminado = true;
      mostrarMensaje("⏰ Tiempo terminado. El examen se enviará automáticamente.", "info");
      enviarExamenAuto();
      return;
    }

    requestAnimationFrame(actualizar);
  }

  requestAnimationFrame(actualizar);
  btnEnviar.addEventListener("click", () => (terminado = true), { once: true });
}

// =========================
//  BLOQUEO: SALIR O CAMBIAR PESTAÑA
// =========================
window.onbeforeunload = function () {
  if (examenComenzado) {
    return "Estás en medio del examen. Si cierras o recargas perderás tu progreso.";
  }
};

document.addEventListener("visibilitychange", () => {
  if (document.hidden && examenComenzado) {
    mostrarMensaje("⚠️ No puedes cambiar de pestaña durante el examen.", "error");
    window.location.href = "certificaciones.html";
  }
});

// =========================
//  ENVÍO AUTO POR TIEMPO
// =========================
async function enviarExamenAuto() {
  const respuestas = examen.map(p => {
    const seleccion = document.querySelector(`input[name="pregunta_${p.id}"]:checked`);
    return { id: p.id, respuesta: seleccion ? seleccion.value : null };
  });

  try {
    const res = await fetch("http://localhost:3000/api/exams/submit", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ respuestas })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem(`examenRealizado_${usuarioActual}`, "true");
      if (data.attemptId) localStorage.setItem("attemptId", data.attemptId);

      localStorage.setItem("ultimaCalificacion", data.calificacion.toFixed(1));
      resultado.innerHTML = `
        <h3>Calificación: ${data.calificacion.toFixed(1)}%</h3>
        <p>${data.aprobado ? "Aprobado ✅" : "No aprobado ❌"}</p>
      `;

      // 👉 Si el back envía detalle con correctas, lo usamos; si no, solo deshabilitamos opciones
      mostrarRetroalimentacion(respuestas, data.detalle);
      if (data.aprobado) mostrarBotonCertificado();
      mostrarBotonVolver();
    }
  } catch {
    mostrarMensaje("No se pudo conectar con el servidor. Intenta de nuevo.", "error");
  }
}

// =========================
//     CARGAR EXAMEN
// =========================
async function cargarExamen() {
  try {
    const res = await fetch("http://localhost:3000/api/exams/start", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.message || "Error al generar el examen";
      mostrarMensaje(msg, "error");

      if (res.status === 400 && msg.toLowerCase().includes("solo se puede aplicar una vez")) {
        localStorage.setItem(`examenRealizado_${usuarioActual}`, "true");
        window.location.href = "certificaciones.html";
        return;
      }

      if (res.status === 403) {
        localStorage.removeItem("token");
        mostrarMensaje("Tu sesión expiró. Inicia sesión de nuevo.", "error");
        window.location.href = "index.html";
        return;
      }

      return;
    }

    examen = data.examen;
    mostrarPreguntas(examen);
    examenComenzado = true;
  } catch {
    mostrarMensaje("No se pudo conectar con el servidor. Intenta de nuevo.", "error");
  }
}

// =========================
//   RENDER PREGUNTAS
// =========================
function mostrarPreguntas(preguntas) {
  contenedor.innerHTML = "";

  let temporizadorElemento = document.getElementById("temporizador");
  if (!temporizadorElemento) {
    temporizadorElemento = document.createElement("p");
    temporizadorElemento.id = "temporizador";
    temporizadorElemento.style.fontWeight = "bold";
    temporizadorElemento.style.fontSize = "18px";
    temporizadorElemento.style.color = "#d9534f";
    temporizadorElemento.textContent = "Tiempo restante: 05:00";
    contenedor.before(temporizadorElemento);
  }

  preguntas.forEach((p, i) => {
    const div = document.createElement("div");
    div.classList.add("pregunta");
    div.innerHTML = `
      <h3>${i + 1}. ${p.pregunta}</h3>
      ${p.opciones.map(op => `
        <label><input type="radio" name="pregunta_${p.id}" value="${op}"> ${op}</label><br>
      `).join("")}
      <hr>
    `;
    contenedor.appendChild(div);
  });

  setTimeout(() => iniciarTemporizador(temporizadorElemento), 500);
  btnEnviar.disabled = false;
  btnEnviar.textContent = "Enviar Examen";
}

// =========================
//  COMPROBAR RESPUESTAS
// =========================
function todasRespondidas() {
  return examen.every(p => document.querySelector(`input[name="pregunta_${p.id}"]:checked`));
}

// =========================
//  ENVÍO MANUAL (click)
// =========================
btnEnviar.addEventListener("click", async () => {
  if (!examen.length) {
    mostrarMensaje("El examen no está cargado correctamente.", "error");
    return;
  }

  if (!todasRespondidas()) {
    mostrarMensaje("Debes responder todas las preguntas antes de enviar el examen.", "error");
    return;
  }

  const respuestas = examen.map(p => {
    const seleccion = document.querySelector(`input[name="pregunta_${p.id}"]:checked`);
    return { id: p.id, respuesta: seleccion ? seleccion.value : null };
  });

  btnEnviar.disabled = true;
  btnEnviar.textContent = "Enviando...";

  try {
    const res = await fetch("http://localhost:3000/api/exams/submit", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ respuestas })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem(`examenRealizado_${usuarioActual}`, "true");
      if (data.attemptId) localStorage.setItem("attemptId", data.attemptId);
      localStorage.setItem("ultimaCalificacion", data.calificacion.toFixed(1));

      resultado.innerHTML = `
        <h3>Calificación: ${data.calificacion.toFixed(1)}%</h3>
        <p>${data.aprobado ? "Aprobado ✅" : "No aprobado ❌"}</p>
      `;
      // 👉 Si el back envía detalle con correctas, lo usamos; si no, solo deshabilitamos opciones
      mostrarRetroalimentacion(respuestas, data.detalle);

      if (data.aprobado) mostrarBotonCertificado();
      mostrarBotonVolver();
    } else {
      mostrarMensaje(data.message || "Error al enviar examen", "error");
      btnEnviar.disabled = false;
      btnEnviar.textContent = "Enviar Examen";
    }
  } catch {
    mostrarMensaje("Error al conectar con el servidor.", "error");
    btnEnviar.disabled = false;
    btnEnviar.textContent = "Enviar Examen";
  }

  examenComenzado = false;
});

// =========================
//  RETROALIMENTACIÓN
// =========================
function mostrarRetroalimentacion(respuestas, detalle = null) {
  respuestas.forEach(r => {
    const inputCualquiera = document.querySelector(`input[name="pregunta_${r.id}"]`);
    if (!inputCualquiera) return;

    const divPregunta = inputCualquiera.closest(".pregunta");
    const opciones = divPregunta.querySelectorAll("input");

    // Si el back nos manda las correctas, las usamos para pintar
    let correcta = null;
    if (Array.isArray(detalle)) {
      const fila = detalle.find(d => d.id === r.id);
      if (fila && typeof fila.correcta === "string") correcta = fila.correcta;
    }

    opciones.forEach(op => {
      const label = op.parentElement;
      // Si tenemos la correcta desde el back, pintamos verde la correcta
      if (correcta && op.value === correcta) {
        label.style.color = "green";
        label.style.fontWeight = "600";
      }
      // Si el usuario eligió y (si conocemos la correcta) fue incorrecta -> rojo
      if (op.checked && correcta && op.value !== correcta) {
        label.style.color = "red";
        const p = document.createElement("p");
        p.style.color = "green";
        p.style.fontSize = "0.9em";
        p.style.marginTop = "5px";
        p.textContent = `Respuesta correcta: ${correcta}`;
        divPregunta.appendChild(p);
      }
      op.disabled = true;
    });

    // Si NO tenemos correctas del back, al menos bloqueamos inputs
    if (!correcta) {
      opciones.forEach(op => (op.disabled = true));
    }
  });
}

// =========================
//  CERTIFICADO (PDF)
// =========================
function mostrarBotonCertificado() {
  if (document.getElementById("btnCert")) return;

  const btnCert = document.createElement("button");
  btnCert.id = "btnCert";
  btnCert.textContent = "Generar Certificado PDF";
  btnCert.style.marginTop = "10px";
  btnCert.style.background = "#007bff";
  btnCert.style.color = "#fff";
  btnCert.style.border = "none";
  btnCert.style.padding = "10px 20px";
  btnCert.style.borderRadius = "6px";
  btnCert.style.cursor = "pointer";
  btnCert.style.fontWeight = "bold";

  btnCert.addEventListener("click", async () => {
    const attemptId = localStorage.getItem("attemptId");
    const userName = localStorage.getItem("nombre") || "Alumno/a";
    const courseName = "Certificación en Desarrollo Web";
    const gradeValue = localStorage.getItem("ultimaCalificacion") || "0";

    // 👉 Parámetros extra requeridos por la rúbrica (se renderizan en el BACK)
    const city = "Aguascalientes, MX";
    const company = "CertiCode Solutions";
    const instructor = "Ing. Nombre Instructor";
    const ceo = "Nombre CEO";

    try {
      const resPDF = await fetch(
        `http://localhost:3000/api/certs/${attemptId}/pdf?name=${encodeURIComponent(
          userName
        )}&course=${encodeURIComponent(courseName)}&grade=${encodeURIComponent(
          gradeValue
        )}&city=${encodeURIComponent(city)}&company=${encodeURIComponent(
          company
        )}&instructor=${encodeURIComponent(instructor)}&ceo=${encodeURIComponent(ceo)}`,
        {
          method: "GET",
          headers: { Authorization: "Bearer " + token },
        }
      );

      const pdfData = await resPDF.json();
      if (resPDF.ok && pdfData.path) {
        window.open(`http://localhost:3000${pdfData.path}`, "_blank");
      } else {
        mostrarMensaje("Error al generar el certificado PDF.", "error");
      }
    } catch {
      mostrarMensaje("Error al conectar con el servidor para generar el PDF.", "error");
    }
  });

  resultado.appendChild(btnCert);
}

// =========================
//   VOLVER AL INICIO
// =========================
function mostrarBotonVolver() {
  if (document.getElementById("btnVolver")) return;

  const btnVolver = document.createElement("button");
  btnVolver.id = "btnVolver";
  btnVolver.textContent = "Volver al inicio";
  btnVolver.addEventListener("click", () => {
    window.location.href = "index.html";
  });
  resultado.appendChild(btnVolver);
}

// =========================
//  MENSAJE NO BLOQUEANTE
// =========================
function mostrarMensaje(texto, tipo = "info") {
  setTimeout(() => {
    const viejo = document.getElementById("msgAviso");
    if (viejo) viejo.remove();

    const msg = document.createElement("div");
    msg.id = "msgAviso";
    msg.textContent = texto;
    Object.assign(msg.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "12px 20px",
      borderRadius: "8px",
      fontWeight: "bold",
      zIndex: "9999",
      transition: "opacity 0.3s ease",
      background: tipo === "error" ? "#f44336" : "#2196f3",
      color: "white",
    });

    document.body.appendChild(msg);
    setTimeout(() => {
      msg.style.opacity = "0";
      setTimeout(() => msg.remove(), 500);
    }, 2500);
  }, 0);
}

// =========================
//     INICIAR FLUJO
// =========================
cargarExamen();
