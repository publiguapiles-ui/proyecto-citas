const estadoAcceso = document.getElementById("estado-acceso");
const tarjetaSolicitudes = document.getElementById("tarjeta-solicitudes");
const listaSolicitudes = document.getElementById("lista-solicitudes");
const btnSalir = document.getElementById("btn-salir");

function rechazarAcceso(mensaje) {
  estadoAcceso.innerHTML = `<p class="mensaje-error">${mensaje}</p><p><a href="login.html">Ir a iniciar sesión</a></p>`;
  tarjetaSolicitudes.style.display = "none";
}

function renderSolicitudes(solicitudes) {
  if (solicitudes.length === 0) {
    listaSolicitudes.innerHTML = "<p>No hay solicitudes registradas.</p>";
    return;
  }

  listaSolicitudes.innerHTML = solicitudes
    .map(
      (s) => `
      <div class="fila-solicitud">
        <strong>${s.codigo_seguimiento}</strong> — ${s.nombre} (${s.contacto})<br />
        ${new Date(s.fecha_hora).toLocaleString()} · Estado: ${s.estado}
      </div>
    `
    )
    .join("");
}

async function iniciar() {
  const config = await fetch("/api/config").then((r) => r.json());
  const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

  const {
    data: { session },
  } = await client.auth.getSession();

  if (!session) {
    rechazarAcceso("Acceso denegado: no hay una sesión activa. Iniciá sesión con tu enlace mágico.");
    return;
  }

  const respuesta = await fetch("/api/admin/solicitudes", {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!respuesta.ok) {
    const datos = await respuesta.json();
    rechazarAcceso(`Acceso denegado: ${datos.error || "sesión inválida"}`);
    return;
  }

  const solicitudes = await respuesta.json();

  estadoAcceso.style.display = "none";
  tarjetaSolicitudes.style.display = "block";
  renderSolicitudes(solicitudes);

  btnSalir.addEventListener("click", async () => {
    await client.auth.signOut();
    window.location.href = "login.html";
  });
}

iniciar();
