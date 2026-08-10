require("dotenv").config();

const path = require("path");
const express = require("express");
const supabase = require("./supabaseClient");
const { generarCodigoSeguimiento } = require("./codigoSeguimiento");

const app = express();
const PORT = 3000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^[+\d][\d\s-]{7,14}\d$/;

function esContactoValido(contacto) {
  return EMAIL_REGEX.test(contacto) || TELEFONO_REGEX.test(contacto);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
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

  res.status(201).json(data);
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

  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
