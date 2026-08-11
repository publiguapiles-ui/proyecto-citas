const CIUDAD = "Guapiles,CR";

async function obtenerClima(fecha) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    const error = new Error(
      "Falta configurar la variable de entorno OPENWEATHER_API_KEY"
    );
    error.codigo = "CONFIG";
    throw error;
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
    CIUDAD
  )}&appid=${apiKey}&units=metric&lang=es`;

  const respuesta = await fetch(url);
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    const error = new Error(datos.message || "Error al consultar OpenWeatherMap");
    error.codigo = "API_EXTERNA";
    throw error;
  }

  const entradasDelDia = datos.list.filter((entrada) =>
    entrada.dt_txt.startsWith(fecha)
  );

  if (entradasDelDia.length === 0) {
    const error = new Error(
      `No hay pronóstico disponible para ${fecha}. OpenWeatherMap (plan gratuito) solo cubre los próximos 5 días.`
    );
    error.codigo = "SIN_DATOS";
    throw error;
  }

  const temperaturas = entradasDelDia.map((e) => e.main.temp);
  const entradaMediodia =
    entradasDelDia.find((e) => e.dt_txt.endsWith("12:00:00")) || entradasDelDia[0];

  return {
    ciudad: datos.city.name,
    fecha,
    temperatura_min: Math.round(Math.min(...temperaturas)),
    temperatura_max: Math.round(Math.max(...temperaturas)),
    descripcion: entradaMediodia.weather[0].description,
    humedad: entradaMediodia.main.humidity,
    viento_kmh: Math.round(entradaMediodia.wind.speed * 3.6),
    detalle_por_hora: entradasDelDia.map((e) => ({
      hora: e.dt_txt.split(" ")[1].slice(0, 5),
      temperatura: Math.round(e.main.temp),
      descripcion: e.weather[0].description,
    })),
  };
}

module.exports = { obtenerClima, CIUDAD };
