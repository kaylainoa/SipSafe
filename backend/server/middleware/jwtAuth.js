const jwt = require("jsonwebtoken");

/**
 * Verifies JWT from Authorization: Bearer <token> and sets req.userId.
 * Returns 401 if missing or invalid.
 */
function jwtAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = jwtAuth;
