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

    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/admin.html`,
      },
    });

    if (error) {
      mostrarMensaje(loginResultado, `Error al enviar el enlace: ${error.message}`, true);
      return;
    }

    mostrarMensaje(
      loginResultado,
      `Te enviamos un enlace mágico a ${email}. Abrilo desde este mismo navegador para iniciar sesión.`,
      false
    );
  });
}

iniciar();
