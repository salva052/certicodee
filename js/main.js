const userInfo = document.getElementById("user-info");
const token = localStorage.getItem("token");
const nombre = localStorage.getItem("nombre");

// Si el usuario está logueado, mostrar su nombre y botón de cerrar sesión
if (token && nombre) {
  userInfo.innerHTML = `
    <span>Hola, <strong>${nombre}</strong></span>
    <button id="logoutBtn" class="logout">Cerrar sesión</button>
  `;

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("nombre");
    window.location.href = "index.html";
  });
} else {
  // Si no está logueado, mostrar botón de login
  userInfo.innerHTML = `<button id="btnMostrarLogin">Iniciar sesión</button>`;
}
