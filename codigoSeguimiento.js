const crypto = require("crypto");

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin caracteres ambiguos (0/O, 1/I/L)

function generarCodigoSeguimiento() {
  let sufijo = "";
  for (let i = 0; i < 6; i++) {
    const index = crypto.randomInt(0, ALFABETO.length);
    sufijo += ALFABETO[index];
  }
  return `SOL-${sufijo}`;
}

module.exports = { generarCodigoSeguimiento };
