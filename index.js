require("dotenv").config();

const express = require("express");
const supabase = require("./supabaseClient");
const { generarCodigoSeguimiento } = require("./codigoSeguimiento");

const app = express();
const PORT = 3000;

app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
