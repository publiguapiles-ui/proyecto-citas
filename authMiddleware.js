const supabase = require("./supabaseClient");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "No autenticado: falta el token de sesión" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: "Sesión inválida o expirada" });
  }

  req.user = data.user;
  next();
}

module.exports = { requireAuth };
