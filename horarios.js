const ZONA_HORARIA = "America/Costa_Rica";
const HORA_APERTURA_MIN = 7 * 60; // 07:00 en minutos desde medianoche
const HORA_ULTIMA_CITA_MIN = 16 * 60 + 30; // 16:30, última franja reservable
const DURACION_FRANJA_MIN = 30;

function generarFranjasHorarias() {
  const franjas = [];
  for (let min = HORA_APERTURA_MIN; min <= HORA_ULTIMA_CITA_MIN; min += DURACION_FRANJA_MIN) {
    const hh = String(Math.floor(min / 60)).padStart(2, "0");
    const mm = String(min % 60).padStart(2, "0");
    franjas.push(`${hh}:${mm}`);
  }
  return franjas;
}

function partesEnZonaLocal(fechaHoraIso) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_HORARIA,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const partes = formatter.formatToParts(new Date(fechaHoraIso));
  const obtener = (tipo) => partes.find((p) => p.type === tipo).value;
  const hora24 = obtener("hour") === "24" ? "00" : obtener("hour");
  return {
    diaSemana: obtener("weekday"), // "Sun", "Mon", "Tue", ...
    horaMinuto: `${hora24}:${obtener("minute")}`,
  };
}

function esHorarioValido(fechaHoraIso) {
  const { diaSemana, horaMinuto } = partesEnZonaLocal(fechaHoraIso);
  if (diaSemana === "Sun") return false;
  return generarFranjasHorarias().includes(horaMinuto);
}

// Rango UTC [inicio, fin) que corresponde a un día calendario completo en la
// zona horaria del negocio (Costa Rica, UTC-6 fijo, sin horario de verano).
function rangoUtcParaDiaLocal(fechaYYYYMMDD) {
  const inicio = new Date(`${fechaYYYYMMDD}T00:00:00-06:00`);
  const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
  return { inicio, fin };
}

function horaLocal(fechaHoraIso) {
  return partesEnZonaLocal(fechaHoraIso).horaMinuto;
}

module.exports = {
  generarFranjasHorarias,
  esHorarioValido,
  rangoUtcParaDiaLocal,
  horaLocal,
};
