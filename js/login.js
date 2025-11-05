const modal = document.getElementById("loginModal");
const btnOpen = document.getElementById("btnOpenLogin");
const btnClose = document.getElementById("closeModal");
const btnLogin = document.getElementById("btnLogin");
const msg = document.getElementById("loginMsg");

// ---------- Helpers UI ----------
function mostrarMensaje(texto, tipo = "info") {
  const aviso = document.createElement("div");
  aviso.id = `toast-${Date.now()}`;
  aviso.textContent = texto;
  Object.assign(aviso.style, {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "12px 18px",
    borderRadius: "10px",
    fontWeight: "600",
    zIndex: "9999",
    color: "#fff",
    background:
      tipo === "error" ? "#e11d48" :
      tipo === "warning" ? "#f59e0b" :
      tipo === "success" ? "#10b981" : "#3b82f6",
    opacity: "0",
    transition: "opacity .2s ease"
  });
  document.body.appendChild(aviso);
  requestAnimationFrame(() => (aviso.style.opacity = "1"));
  setTimeout(() => {
    aviso.style.opacity = "0";
    setTimeout(() => aviso.remove(), 300);
  }, 2500);
}

// Confirm no bloqueante (overlay propio)
function confirmarAccion(mensaje = "¿Confirmar?") {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed", inset: "0", background: "rgba(0,0,0,.45)",
      display: "grid", placeItems: "center", zIndex: "10000"
    });
    const card = document.createElement("div");
    Object.assign(card.style, {
      background: "#111827", color: "#e5e7eb", padding: "18px 20px",
      borderRadius: "12px", minWidth: "300px", textAlign: "center",
      boxShadow: "0 10px 28px rgba(0,0,0,.35)"
    });
    const p = document.createElement("p");
    p.textContent = mensaje;
    p.style.margin = "0 0 12px";
    const yes = document.createElement("button");
    yes.textContent = "Sí";
    Object.assign(yes.style, { marginRight: "8px", padding: "8px 14px", borderRadius: "8px", border: "none", cursor: "pointer" });
    const no = document.createElement("button");
    no.textContent = "No";
    Object.assign(no.style, { padding: "8px 14px", borderRadius: "8px", border: "none", cursor: "pointer" });

    yes.onclick = () => { document.body.removeChild(overlay); resolve(true); };
    no.onclick  = () => { document.body.removeChild(overlay); resolve(false); };

    card.append(p, yes, no);
    overlay.append(card);
    document.body.append(overlay);
  });
}

// Mostrar ventana modal
btnOpen.addEventListener("click", async () => {
  // Si ya hay sesión, cerrar sesión (sin confirm nativo)
  if (localStorage.getItem("token")) {
    const ok = await confirmarAccion("¿Seguro que quieres cerrar sesión?");
    if (ok) {
      // 🔧 Solo borrar token y datos de sesión
      localStorage.removeItem("token");
      localStorage.removeItem("nombre");
      localStorage.removeItem("attemptId");
      localStorage.removeItem("ultimaCalificacion");

      btnOpen.textContent = "Iniciar sesión";
      mostrarMensaje("Sesión cerrada correctamente.", "success");
      window.location.href = "index.html";
    }
    return;
  }
  // Si no hay sesión, abrir modal
  modal.style.display = "flex";
});

// Cerrar ventana
btnClose.addEventListener("click", () => {
  modal.style.display = "none";
  msg.textContent = "";
});

// Cerrar si clic fuera del modal
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
    msg.textContent = "";
  }
});

// Función de login
btnLogin.addEventListener("click", async () => {
  const cuenta = document.getElementById("usuario").value.trim();
  const password = document.getElementById("contrasena").value.trim();

  if (!cuenta || !password) {
    msg.style.color = "red";
    msg.textContent = "Por favor llena todos los campos.";
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cuenta, password })
    });

    const data = await res.json();

    if (res.ok) {
      msg.style.color = "green";
      msg.textContent = "Acceso permitido, redirigiendo...";
      localStorage.setItem("token", data.token);
      localStorage.setItem("nombre", data.user.nombre);

      // Cambiar texto del botón
      btnOpen.textContent = "Cerrar sesión";

      // Redirige automáticamente a certificaciones
      setTimeout(() => {
        modal.style.display = "none";
        window.location.href = "certificaciones.html";
      }, 1000);
    } else {
      msg.style.color = "red";
      msg.textContent = data?.message || "Credenciales incorrectas.";
    }
  } catch (e) {
    msg.style.color = "red";
    msg.textContent = "Error de conexión. Inténtalo de nuevo.";
  }
});

// Al cargar la página, verificar si hay sesión activa
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("token")) {
    btnOpen.textContent = "Cerrar sesión";
  } else {
    btnOpen.textContent = "Iniciar sesión";
  }
});
