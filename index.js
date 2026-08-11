require("dotenv").config();

const path = require("path");
const express = require("express");
const supabase = require("./supabaseClient");
const { generarCodigoSeguimiento } = require("./codigoSeguimiento");
const { obtenerClima } = require("./clima");
const { requireAuth } = require("./authMiddleware");
const { enviarCorreoSolicitudRecibida, enviarCorreoConfirmacion } = require("./resend");

const app = express();
const PORT = 3000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^[+\d][\d\s-]{7,14}\d$/;
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function esContactoValido(contacto) {
  return EMAIL_REGEX.test(contacto) || TELEFONO_REGEX.test(contacto);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  });
});

app.post("/solicitudes", async (req, res) => {
  const { nombre, contacto, fecha_hora } = req.body;

  if (!nombre || !contacto || !fecha_hora) {
    return res.status(400).json({
      error: "Los campos nombre, contacto y fecha_hora son obligatorios",
    });
  }

  if (!esContactoValido(contacto)) {
    return res.status(400).json({
      error: "El campo contacto debe ser un email o un teléfono válido",
    });
  }

  const fechaHoraParseada = new Date(fecha_hora);
  if (Number.isNaN(fechaHoraParseada.getTime())) {
    return res.status(400).json({
      error: "El campo fecha_hora no es una fecha/hora válida",
    });
  }
  if (fechaHoraParseada.getTime() <= Date.now()) {
    return res.status(400).json({
      error: "El campo fecha_hora debe ser una fecha/hora futura",
    });
  }

  const codigo_seguimiento = generarCodigoSeguimiento();

  const { data, error } = await supabase
    .from("solicitudes")
    .insert({
      nombre,
      contacto,
      fecha_hora,
      codigo_seguimiento,
      estado: "pendiente",
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  let email_enviado = false;
  let email_error = null;

  if (EMAIL_REGEX.test(data.contacto)) {
    try {
      await enviarCorreoSolicitudRecibida({
        nombre: data.nombre,
        contacto: data.contacto,
        codigo_seguimiento: data.codigo_seguimiento,
        fecha_hora: data.fecha_hora,
      });
      email_enviado = true;
    } catch (err) {
      email_error = err.message;
    }
  }

  res.status(201).json({ ...data, email_enviado, email_error });
});

app.get("/solicitudes/:codigo", async (req, res) => {
  const { codigo } = req.params;

  const { data, error } = await supabase
    .from("solicitudes")
    .select()
    .eq("codigo_seguimiento", codigo)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({
      error: `No se encontró ninguna solicitud con el código ${codigo}`,
    });
  }

  res.json(data);
});

app.patch("/solicitudes/:codigo/confirmar", async (req, res) => {
  const { codigo } = req.params;

  const { data, error } = await supabase
    .from("solicitudes")
    .update({ estado: "confirmada" })
    .eq("codigo_seguimiento", codigo)
    .select()
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({
      error: `No se encontró ninguna solicitud con el código ${codigo}`,
    });
  }

  let email_enviado = false;
  let email_error = null;

  if (EMAIL_REGEX.test(data.contacto)) {
    try {
      await enviarCorreoConfirmacion({
        nombre: data.nombre,
        contacto: data.contacto,
        codigo_seguimiento: data.codigo_seguimiento,
        fecha_hora: data.fecha_hora,
      });
      email_enviado = true;
    } catch (err) {
      email_error = err.message;
    }
  }

  res.json({ ...data, email_enviado, email_error });
});

app.patch("/solicitudes/:codigo/no-show", async (req, res) => {
  const { codigo } = req.params;

  const { data, error } = await supabase
    .from("solicitudes")
    .update({ estado: "no-show" })
    .eq("codigo_seguimiento", codigo)
    .select()
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({
      error: `No se encontró ninguna solicitud con el código ${codigo}`,
    });
  }

  res.json(data);
});

app.get("/clima", async (req, res) => {
  const { fecha } = req.query;

  if (!fecha || !FECHA_REGEX.test(fecha) || Number.isNaN(new Date(fecha).getTime())) {
    return res.status(400).json({
      error: "El parámetro fecha es obligatorio y debe tener el formato YYYY-MM-DD",
    });
  }

  try {
    const pronostico = await obtenerClima(fecha);
    res.json(pronostico);
  } catch (error) {
    if (error.codigo === "CONFIG") {
      return res.status(500).json({ error: error.message });
    }
    if (error.codigo === "SIN_DATOS") {
      return res.status(404).json({ error: error.message });
    }
    if (error.codigo === "API_EXTERNA") {
      return res.status(502).json({
        error: `No se pudo obtener el pronóstico de OpenWeatherMap: ${error.message}`,
      });
    }
    res.status(500).json({ error: "Error inesperado al consultar el clima" });
  }
});

app.get("/api/admin/solicitudes", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("solicitudes")
    .select()
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
