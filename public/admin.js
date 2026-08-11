const estadoAcceso = document.getElementById("estado-acceso");
const panelAdmin = document.getElementById("panel-admin");
const listaSolicitudes = document.getElementById("lista-solicitudes");
const btnSalir = document.getElementById("btn-salir");
const agendaFecha = document.getElementById("agenda-fecha");
const agendaLista = document.getElementById("agenda-lista");

let clienteSupabase = null;
let sesionActual = null;
let solicitudesActuales = [];

const ZONA_HORARIA = "America/Costa_Rica";

function rechazarAcceso(mensaje) {
  estadoAcceso.innerHTML = `<p class="mensaje-error">${mensaje}</p><p><a href="login.html">Ir a iniciar sesión</a></p>`;
  panelAdmin.style.display = "none";
}

function esPasada(fechaHoraIso) {
  return new Date(fechaHoraIso).getTime() < Date.now();
}

function horaLocalCR(fechaHoraIso) {
  return new Date(fechaHoraIso).toLocaleTimeString("en-GB", {
    timeZone: ZONA_HORARIA,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function fechaLocalCR(fechaHoraIso) {
  return new Date(fechaHoraIso).toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA });
}

function generarFranjas() {
  const franjas = [];
  for (let min = 7 * 60; min <= 16 * 60 + 30; min += 30) {
    const hh = String(Math.floor(min / 60)).padStart(2, "0");
    const mm = String(min % 60).padStart(2, "0");
    franjas.push(`${hh}:${mm}`);
  }
  return franjas;
}

function botonesAccion(solicitud) {
  if (solicitud.estado === "pendiente") {
    return `
      <button class="boton-accion btn-confirmar" data-codigo="${solicitud.codigo_seguimiento}">Confirmar</button>
      <button class="boton-accion btn-rechazar" data-codigo="${solicitud.codigo_seguimiento}">Rechazar</button>
    `;
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
          <strong>${s.codigo_seguimiento}</strong> — ${s.nombre} (${s.contacto})
          ${s.categoria ? `· ${s.categoria}` : ""}<br />
          ${new Date(s.fecha_hora).toLocaleString()} · Estado:
          <span class="estado-badge estado-${s.estado}">${s.estado}</span>
        </div>
        <div class="fila-acciones">${botonesAccion(s)}</div>
      </div>
    `
    )
    .join("");
}

function renderAgenda() {
  const fecha = agendaFecha.value;
  if (!fecha) {
    agendaLista.innerHTML = "";
    return;
  }

  agendaLista.innerHTML = generarFranjas()
    .map((franja) => {
      const solicitud = solicitudesActuales.find(
        (s) => fechaLocalCR(s.fecha_hora) === fecha && horaLocalCR(s.fecha_hora) === franja
      );

      if (!solicitud) {
        return `
          <div class="agenda-franja">
            <span class="agenda-hora">${franja}</span>
            <span class="agenda-detalle agenda-libre">Libre</span>
          </div>
        `;
      }

      return `
        <div class="agenda-franja ocupada">
          <span class="agenda-hora">${franja}</span>
          <span class="agenda-detalle">
            <strong>${solicitud.codigo_seguimiento}</strong> — ${solicitud.nombre}
            ${solicitud.categoria ? `(${solicitud.categoria})` : ""}
            <span class="estado-badge estado-${solicitud.estado}">${solicitud.estado}</span>
          </span>
          <span class="fila-acciones">${botonesAccion(solicitud)}</span>
        </div>
      `;
    })
    .join("");
}

function renderTodo() {
  renderSolicitudes(solicitudesActuales);
  renderAgenda();
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

  solicitudesActuales = await respuesta.json();
  renderTodo();
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

function alClicAccion(evento) {
  const boton = evento.target;
  const codigo = boton.dataset.codigo;
  if (!codigo) return;

  if (boton.classList.contains("btn-confirmar")) {
    cambiarEstado(codigo, "confirmar", boton);
  } else if (boton.classList.contains("btn-rechazar")) {
    cambiarEstado(codigo, "rechazar", boton);
  } else if (boton.classList.contains("btn-noshow")) {
    cambiarEstado(codigo, "no-show", boton);
  }
}

listaSolicitudes.addEventListener("click", alClicAccion);
agendaLista.addEventListener("click", alClicAccion);

agendaFecha.addEventListener("change", renderAgenda);

function ponerFechaDeHoyEnAgenda() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  agendaFecha.value = `${yyyy}-${mm}-${dd}`;
}

async function iniciar() {
  const config = await fetch("/api/config").then((r) => r.json());
  clienteSupabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

  const {
    data: { session },
  } = await clienteSupabase.auth.getSession();

  if (!session) {
    rechazarAcceso("Acceso denegado: no hay una sesión activa. Iniciá sesión con tu email y contraseña.");
    return;
  }

  sesionActual = session;

  estadoAcceso.style.display = "none";
  panelAdmin.style.display = "block";

  ponerFechaDeHoyEnAgenda();
  await cargarSolicitudes();

  btnSalir.addEventListener("click", async () => {
    await clienteSupabase.auth.signOut();
    window.location.href = "login.html";
  });
}

iniciar();
