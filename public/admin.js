const estadoAcceso = document.getElementById("estado-acceso");
const tarjetaSolicitudes = document.getElementById("tarjeta-solicitudes");
const listaSolicitudes = document.getElementById("lista-solicitudes");
const btnSalir = document.getElementById("btn-salir");

let clienteSupabase = null;
let sesionActual = null;

function rechazarAcceso(mensaje) {
  estadoAcceso.innerHTML = `<p class="mensaje-error">${mensaje}</p><p><a href="login.html">Ir a iniciar sesión</a></p>`;
  tarjetaSolicitudes.style.display = "none";
}

function esPasada(fechaHoraIso) {
  return new Date(fechaHoraIso).getTime() < Date.now();
}

function botonAccion(solicitud) {
  if (solicitud.estado === "pendiente") {
    return `<button class="boton-accion btn-confirmar" data-codigo="${solicitud.codigo_seguimiento}">Confirmar</button>`;
  }

  if (solicitud.estado === "confirmada" && esPasada(solicitud.fecha_hora)) {
    return `<button class="boton-accion btn-noshow" data-codigo="${solicitud.codigo_seguimiento}">Marcar no-show</button>`;
  }

  return "";
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
        <div class="fila-info">
          <strong>${s.codigo_seguimiento}</strong> — ${s.nombre} (${s.contacto})<br />
          ${new Date(s.fecha_hora).toLocaleString()} · Estado:
          <span class="estado-badge estado-${s.estado}">${s.estado}</span>
        </div>
        <div class="fila-acciones">${botonAccion(s)}</div>
      </div>
    `
    )
    .join("");
}

async function cargarSolicitudes() {
  const respuesta = await fetch("/api/admin/solicitudes", {
    headers: { Authorization: `Bearer ${sesionActual.access_token}` },
  });

  if (!respuesta.ok) {
    const datos = await respuesta.json();
    rechazarAcceso(`Acceso denegado: ${datos.error || "sesión inválida"}`);
    return;
  }

  const solicitudes = await respuesta.json();
  renderSolicitudes(solicitudes);
}

async function cambiarEstado(codigo, ruta, boton) {
  boton.disabled = true;
  boton.textContent = "Procesando...";

  try {
    const respuesta = await fetch(`/solicitudes/${encodeURIComponent(codigo)}/${ruta}`, {
      method: "PATCH",
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      alert(datos.error || "Ocurrió un error al actualizar la solicitud");
      boton.disabled = false;
      return;
    }

    await cargarSolicitudes();
  } catch (err) {
    alert("No se pudo conectar con el servidor");
    boton.disabled = false;
  }
}

listaSolicitudes.addEventListener("click", (evento) => {
  const boton = evento.target;
  const codigo = boton.dataset.codigo;
  if (!codigo) return;

  if (boton.classList.contains("btn-confirmar")) {
    cambiarEstado(codigo, "confirmar", boton);
  } else if (boton.classList.contains("btn-noshow")) {
    cambiarEstado(codigo, "no-show", boton);
  }
});

async function iniciar() {
  const config = await fetch("/api/config").then((r) => r.json());
  clienteSupabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

  const {
    data: { session },
  } = await clienteSupabase.auth.getSession();

  if (!session) {
    rechazarAcceso("Acceso denegado: no hay una sesión activa. Iniciá sesión con tu enlace mágico.");
    return;
  }

  sesionActual = session;

  estadoAcceso.style.display = "none";
  tarjetaSolicitudes.style.display = "block";
  await cargarSolicitudes();

  btnSalir.addEventListener("click", async () => {
    await clienteSupabase.auth.signOut();
    window.location.href = "login.html";
  });
}

iniciar();
