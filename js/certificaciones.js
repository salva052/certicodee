// js/certificaciones.js o main.js (según tu estructura)
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const btnPagar = document.getElementById("btnPagar");
  const btnExamen = document.getElementById("btnExamen");

  if (!token) {
    mostrarMensaje("⚠️ Debes iniciar sesión para acceder a las certificaciones", "warning");
  }

  // 🧾 Confirmación de pago
  btnPagar.addEventListener("click", () => {
    if (!token) {
      mostrarMensaje("Debes iniciar sesión para poder pagar el examen", "warning");
      return;
    }

    // ❌ Ya no usamos localStorage "pagado" porque era global
    // ahora consultaremos el backend real al confirmar pago

    // 🪟 Crear ventana de confirmación flotante
    const confirmBox = document.createElement("div");
    confirmBox.classList.add("confirm-box");
    confirmBox.innerHTML = `
      <div class="confirm-content">
        <h3>Confirmar pago</h3>
        <p>¿Deseas pagar <strong>$499 MXN</strong> por el examen de certificación?</p>
        <div class="confirm-buttons">
          <button id="confirmYes">Sí, pagar</button>
          <button id="confirmNo">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(confirmBox);

    // ✅ Si acepta el pago
    document.getElementById("confirmYes").addEventListener("click", async () => {
      try {
        const res = await fetch("http://localhost:3000/api/exams/pay", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
          }
        });

        const data = await res.json();

        if (res.ok) {
          mostrarMensaje("Pago registrado correctamente 💸", "success");
          generarComprobante();

          // Guardamos el estado de pago SOLO para este usuario
          const nombre = localStorage.getItem("nombre") || "usuario";
          localStorage.setItem(`pagado_${nombre}`, "true");

          // 🔓 Habilitar botón de examen
          if (btnExamen) btnExamen.disabled = false;
        } else {
          mostrarMensaje(data.message || "No se pudo registrar el pago", "error");
        }
      } catch (err) {
        console.error(err);
        mostrarMensaje("Error al conectar con el servidor", "error");
      } finally {
        document.body.removeChild(confirmBox);
      }
    });

    // ❌ Si cancela
    document.getElementById("confirmNo").addEventListener("click", () => {
      document.body.removeChild(confirmBox);
    });
  });

  // 🧩 Botón iniciar examen
  btnExamen.addEventListener("click", (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const nombre = localStorage.getItem("nombre") || "usuario";
    const pagado = localStorage.getItem(`pagado_${nombre}`); // ✅ pago individual

    // Soporte a ambos formatos de bandera "examenRealizado"
    const examenRealizado =
      localStorage.getItem(`examenRealizado_${nombre}`) ||
      localStorage.getItem("examenRealizado");

    if (!token) {
      mostrarMensaje("Debes iniciar sesión antes de comenzar el examen", "warning");
      return;
    }

    if (pagado !== "true") {
      mostrarMensaje("Debes realizar el pago antes de iniciar el examen", "warning");
      return;
    }

    if (examenRealizado === "true") {
      mostrarMensaje("Ya realizaste este examen, no puedes volver a hacerlo.", "error");
      return;
    }

    // ✅ Si todo está correcto
    mostrarMensaje("Examen disponible. Serás redirigido ahora.", "info");
    setTimeout(() => (window.location.href = "examen.html"), 600);
  });
});

/* 💬 Mensajes flotantes */
function mostrarMensaje(texto, tipo = "info") {
  const mensaje = document.createElement("div");
  mensaje.className = `mensaje ${tipo}`;
  mensaje.textContent = texto;
  document.body.appendChild(mensaje);

  setTimeout(() => mensaje.classList.add("mostrar"), 50);
  setTimeout(() => {
    mensaje.classList.remove("mostrar");
    setTimeout(() => mensaje.remove(), 500);
  }, 3000);
}

/* 🧾 Generar comprobante visual */
function generarComprobante() {
  const nombre = localStorage.getItem("nombre") || "Usuario";
  const fecha = new Date().toLocaleString("es-MX");

  const comprobante = document.createElement("div");
  comprobante.classList.add("comprobante");
  comprobante.innerHTML = `
    <div class="comprobante-content">
      <h3>Comprobante de Pago</h3>
      <p><strong>Nombre:</strong> ${nombre}</p>
      <p><strong>Certificación:</strong> JavaScript Básico</p>
      <p><strong>Monto:</strong> $499 MXN</p>
      <p><strong>Fecha:</strong> ${fecha}</p>
      <button id="cerrarComprobante">Cerrar</button>
    </div>
  `;
  document.body.appendChild(comprobante);

  document.getElementById("cerrarComprobante").addEventListener("click", () => {
    document.body.removeChild(comprobante);
  });
}
