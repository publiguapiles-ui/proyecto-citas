async function enviarCorreo({ contacto, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const error = new Error("Falta configurar la variable de entorno RESEND_API_KEY");
    error.codigo = "CONFIG";
    throw error;
  }

  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Taller Mecánica Automotriz Madrigal <onboarding@resend.dev>",
      to: [contacto],
      subject,
      html,
    }),
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    const error = new Error(datos.message || "Error al enviar el correo con Resend");
    error.codigo = "API_EXTERNA";
    throw error;
  }

  return datos;
}

function formatearFecha(fecha_hora) {
  return new Date(fecha_hora).toLocaleString("es-CR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

async function enviarCorreoSolicitudRecibida({ nombre, contacto, codigo_seguimiento, fecha_hora }) {
  return enviarCorreo({
    contacto,
    subject: "Recibimos tu solicitud de cita",
    html: `
      <h2>¡Hola ${nombre}!</h2>
      <p>Recibimos tu solicitud de cita en <strong>Taller Mecánica Automotriz Madrigal</strong>.</p>
      <p><strong>Código de seguimiento:</strong> ${codigo_seguimiento}</p>
      <p><strong>Fecha y hora solicitada:</strong> ${formatearFecha(fecha_hora)}</p>
      <p>Guardá este código: lo vas a necesitar para consultar el estado de tu solicitud, y te vamos a escribir de nuevo apenas la confirmemos.</p>
    `,
  });
}

async function enviarCorreoConfirmacion({ nombre, contacto, codigo_seguimiento, fecha_hora }) {
  return enviarCorreo({
    contacto,
    subject: "Tu cita fue confirmada",
    html: `
      <h2>¡Hola ${nombre}!</h2>
      <p>Tu cita en <strong>Taller Mecánica Automotriz Madrigal</strong> fue confirmada.</p>
      <p><strong>Código de seguimiento:</strong> ${codigo_seguimiento}</p>
      <p><strong>Fecha y hora:</strong> ${formatearFecha(fecha_hora)}</p>
      <p>Podés consultar el estado de tu solicitud en cualquier momento usando tu código.</p>
    `,
  });
}

module.exports = { enviarCorreoSolicitudRecibida, enviarCorreoConfirmacion };
