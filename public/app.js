const formCrear = document.getElementById("form-crear");
const crearResultado = document.getElementById("crear-resultado");

const formConsultar = document.getElementById("form-consultar");
const consultarResultado = document.getElementById("consultar-resultado");

const inputFecha = document.getElementById("fecha");

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

ponerFechaDeHoyPorDefecto();

formCrear.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const contacto = document.getElementById("contacto").value;
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;
  const fecha_hora = `${fecha}T${hora}`;

  try {
    const respuesta = await fetch("/solicitudes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, contacto, fecha_hora }),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mostrarMensaje(crearResultado, datos.error || "Ocurrió un error", true);
      return;
    }

    mostrarMensaje(
      crearResultado,
      `Solicitud creada. Tu código de seguimiento es: ${datos.codigo_seguimiento}`,
      false
    );
    formCrear.reset();
    ponerFechaDeHoyPorDefecto();
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
      `Nombre: ${datos.nombre} | Fecha y hora: ${new Date(datos.fecha_hora).toLocaleString()} | Estado: ${datos.estado}`,
      false
    );
  } catch (err) {
    mostrarMensaje(consultarResultado, "No se pudo conectar con el servidor", true);
  }
});
