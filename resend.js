async function enviarCorreoConfirmacion({ nombre, contacto, codigo_seguimiento, fecha_hora }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const error = new Error("Falta configurar la variable de entorno RESEND_API_KEY");
    error.codigo = "CONFIG";
    throw error;
  }

  const fechaFormateada = new Date(fecha_hora).toLocaleString("es-CR", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Taller Mecánica Automotriz Madrigal <onboarding@resend.dev>",
      to: [contacto],
      subject: "Tu cita fue confirmada",
      html: `
        <h2>¡Hola ${nombre}!</h2>
        <p>Tu cita en <strong>Taller Mecánica Automotriz Madrigal</strong> fue confirmada.</p>
        <p><strong>Código de seguimiento:</strong> ${codigo_seguimiento}</p>
        <p><strong>Fecha y hora:</strong> ${fechaFormateada}</p>
        <p>Podés consultar el estado de tu solicitud en cualquier momento usando tu código.</p>
      `,
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

module.exports = { enviarCorreoConfirmacion };
