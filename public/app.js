const formCrear = document.getElementById("form-crear");
const crearResultado = document.getElementById("crear-resultado");

const formConsultar = document.getElementById("form-consultar");
const consultarResultado = document.getElementById("consultar-resultado");

const inputFecha = document.getElementById("fecha");
const selectHora = document.getElementById("hora");
const climaInfo = document.getElementById("clima-info");

function mostrarMensaje(contenedor, mensaje, esError) {
  contenedor.textContent = mensaje;
  contenedor.className = esError ? "mensaje-error" : "mensaje-ok";
}

function ponerFechaDeHoyPorDefecto() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  inputFecha.value = `${yyyy}-${mm}-${dd}`;
}

function esDomingo(fechaYYYYMMDD) {
  const [y, m, d] = fechaYYYYMMDD.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 0;
}

async function actualizarClima() {
  const fecha = inputFecha.value;
  if (!fecha) {
    climaInfo.textContent = "";
    return;
  }

  climaInfo.textContent = "Consultando el clima...";
  climaInfo.className = "clima-info";

  try {
    const respuesta = await fetch(`/clima?fecha=${encodeURIComponent(fecha)}`);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      // El pronóstico gratuito de OpenWeatherMap solo cubre ~5 días:
      // para la mayoría de las fechas de una cita simplemente no hay dato,
      // así que lo mostramos como aviso discreto, no como error.
      climaInfo.textContent =
        respuesta.status === 404
          ? "Pronóstico no disponible todavía para esta fecha (solo se puede ver desde ~5 días antes)."
          : datos.error || "No se pudo obtener el clima";
      climaInfo.className = "clima-info clima-sin-dato";
      return;
    }

    climaInfo.textContent = `🌤️ Pronóstico para ${datos.fecha}: ${datos.temperatura_min}°C - ${datos.temperatura_max}°C, ${datos.descripcion}`;
    climaInfo.className = "clima-info clima-disponible";
  } catch (err) {
    climaInfo.textContent = "";
  }
}

async function actualizarHorasDisponibles() {
  const fecha = inputFecha.value;
  selectHora.innerHTML = "";

  if (!fecha) {
    selectHora.innerHTML = '<option value="" disabled selected>Elegí una fecha primero</option>';
    return;
  }

  if (esDomingo(fecha)) {
    selectHora.innerHTML = '<option value="" disabled selected>Cerrado los domingos</option>';
    return;
  }

  selectHora.innerHTML = '<option value="" disabled selected>Cargando horarios...</option>';

  try {
    const respuesta = await fetch(`/disponibilidad?fecha=${encodeURIComponent(fecha)}`);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      selectHora.innerHTML = '<option value="" disabled selected>No se pudo cargar la disponibilidad</option>';
      return;
    }

    const opciones = ['<option value="" disabled selected>Elegí una hora</option>'];
    for (const franja of datos.franjas) {
      const ocupada = datos.ocupadas.includes(franja);
      opciones.push(
        `<option value="${franja}" ${ocupada ? "disabled" : ""}>${franja}${ocupada ? " (ocupado)" : ""}</option>`
      );
    }
    selectHora.innerHTML = opciones.join("");
  } catch (err) {
    selectHora.innerHTML = '<option value="" disabled selected>No se pudo conectar con el servidor</option>';
  }
}

async function alCambiarFecha() {
  actualizarClima();
  await actualizarHorasDisponibles();
}

inputFecha.addEventListener("change", alCambiarFecha);

ponerFechaDeHoyPorDefecto();
alCambiarFecha();

formCrear.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const contacto = document.getElementById("contacto").value;
  const categoria = document.getElementById("categoria").value;
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;
  // new Date("YYYY-MM-DDTHH:mm") se interpreta en la hora local del navegador;
  // toISOString() la convierte a UTC explícito para que el servidor (que corre
  // en otra zona horaria) no la reinterprete como si fuera su propia hora local.
  const fecha_hora = new Date(`${fecha}T${hora}`).toISOString();

  try {
    const respuesta = await fetch("/solicitudes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, contacto, categoria, fecha_hora }),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mostrarMensaje(crearResultado, datos.error || "Ocurrió un error", true);
      if (respuesta.status === 409) {
        actualizarHorasDisponibles();
      }
      return;
    }

    mostrarMensaje(
      crearResultado,
      `Solicitud creada. Tu código de seguimiento es: ${datos.codigo_seguimiento}`,
      false
    );
    formCrear.reset();
    ponerFechaDeHoyPorDefecto();
    alCambiarFecha();
  } catch (err) {
    mostrarMensaje(crearResultado, "No se pudo conectar con el servidor", true);
  }
});

formConsultar.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const codigo = document.getElementById("codigo").value.trim();

  try {
    const respuesta = await fetch(`/solicitudes/${encodeURIComponent(codigo)}`);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mostrarMensaje(consultarResultado, datos.error || "Ocurrió un error", true);
      return;
    }

    mostrarMensaje(
      consultarResultado,
      `Nombre: ${datos.nombre} | Categoría: ${datos.categoria || "—"} | Fecha y hora: ${new Date(datos.fecha_hora).toLocaleString()} | Estado: ${datos.estado}`,
      false
    );
  } catch (err) {
    mostrarMensaje(consultarResultado, "No se pudo conectar con el servidor", true);
  }
});
