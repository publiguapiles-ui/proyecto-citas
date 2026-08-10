const formCrear = document.getElementById("form-crear");
const crearResultado = document.getElementById("crear-resultado");

const formConsultar = document.getElementById("form-consultar");
const consultarResultado = document.getElementById("consultar-resultado");

function mostrarMensaje(contenedor, mensaje, esError) {
  contenedor.textContent = mensaje;
  contenedor.className = esError ? "mensaje-error" : "mensaje-ok";
}

formCrear.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const contacto = document.getElementById("contacto").value;
  const fecha_hora = document.getElementById("fecha_hora").value;

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
