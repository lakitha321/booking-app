import express from "express";
import User from "../models/User.js";
import { loginSchema, registerSchema } from "../validation/authSchema.js";
import requireAuth from "../middleware/requireAuth.js";
import { hashPassword, signToken, verifyPassword } from "../utils/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const existing = await User.findOne({ email: parsed.data.email });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = hashPassword(parsed.data.password);
    const user = await User.create({ ...parsed.data, passwordHash });

    const token = signToken(user._id.toString());
    return res.status(201).json({ token, user: user.toProfile() });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const user = await User.findOne({ email: parsed.data.email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user._id.toString());
    return res.json({ token, user: user.toProfile() });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Not found" });
    return res.json({ user: user.toProfile() });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

