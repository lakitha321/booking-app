import { verifyToken } from "../utils/auth.js";

export default function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Missing authorization" });

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    return next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

