// contacto.js – Envía el formulario al backend y muestra toasts
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formContacto");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validación simple
    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const mensaje = document.getElementById("mensaje").value.trim();
    const privacidad = document.getElementById("privacidad").checked;

    if (!nombre || !correo || !mensaje) {
      toast("Completa los campos obligatorios.", "error");
      return;
    }
    if (!privacidad) {
      toast("Debes aceptar el aviso de privacidad.", "warning");
      return;
    }

    // Estructura solicitada por tu backend: { nombre, correo, mensaje }
    try {
      const res = await fetch("http://localhost:3000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, correo, mensaje })
      });

      const data = await res.json();

      if (res.ok) {
        toast("Mensaje enviado correctamente. 🎉", "success");
        form.reset();
      } else {
        toast(data.message || "No se pudo enviar el mensaje.", "error");
      }
    } catch (err) {
      toast("Error de conexión con el servidor.", "error");
    }
  });
});

// Toast local (compatibles con estilos globales .mensaje)
function toast(texto, tipo = "info") {
  const el = document.createElement("div");
  el.className = `mensaje ${tipo}`;
  el.textContent = texto;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add("mostrar"), 40);
  setTimeout(() => { el.classList.remove("mostrar"); setTimeout(() => el.remove(), 400); }, 3000);
}
