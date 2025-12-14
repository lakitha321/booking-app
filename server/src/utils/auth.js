import crypto from "crypto";

const TOKEN_SECRET = process.env.JWT_SECRET || "dev-secret";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const ITERATIONS = 120000;
const KEY_LEN = 64;
const DIGEST = "sha512";

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  const hashBuf = Buffer.from(hash, "hex");
  const derivedBuf = Buffer.from(derived, "hex");
  if (hashBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, derivedBuf);
}

export function signToken(userId) {
  const payload = { userId, exp: Date.now() + TOKEN_TTL_MS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", TOKEN_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyToken(token) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) throw new Error("Malformed token");

  const expected = crypto.createHmac("sha256", TOKEN_SECRET).update(encoded).digest("base64url");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new Error("Bad signature");
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
  if (!payload.exp || payload.exp < Date.now()) throw new Error("Expired");
  return payload;
}

