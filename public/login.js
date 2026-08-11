const formLogin = document.getElementById("form-login");
const loginResultado = document.getElementById("login-resultado");

function mostrarMensaje(contenedor, mensaje, esError) {
  contenedor.textContent = mensaje;
  contenedor.className = esError ? "mensaje-error" : "mensaje-ok";
}

async function iniciar() {
  const config = await fetch("/api/config").then((r) => r.json());
  const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

  const { data: sesion } = await client.auth.getSession();
  if (sesion.session) {
    window.location.href = "admin.html";
    return;
  }

  formLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
      mostrarMensaje(loginResultado, "Email o contraseña incorrectos", true);
      return;
    }

    window.location.href = "admin.html";
  });
}

iniciar();
