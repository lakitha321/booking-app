import express from "express";
import Size from "../models/Size.js";
import { sizeCreateSchema, sizeUpdateSchema } from "../validation/sizeSchema.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const parsed = sizeCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const existing = await Size.findOne({ name: parsed.data.name.trim() });
    if (existing) return res.status(409).json({ error: "Size name must be unique" });

    const size = await Size.create(parsed.data);
    return res.status(201).json(size);
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/", async (_req, res) => {
  try {
    const sizes = await Size.find({}).sort({ name: 1 });
    return res.json(sizes);
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const size = await Size.findById(req.params.id);
    if (!size) return res.status(404).json({ error: "Not found" });
    return res.json(size);
  } catch (e) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const parsed = sizeUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    if (parsed.data.name) {
      const conflict = await Size.findOne({ name: parsed.data.name.trim(), _id: { $ne: req.params.id } });
      if (conflict) return res.status(409).json({ error: "Size name must be unique" });
    }

    const size = await Size.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
    if (!size) return res.status(404).json({ error: "Not found" });
    return res.json(size);
  } catch (e) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const size = await Size.findByIdAndDelete(req.params.id);
    if (!size) return res.status(404).json({ error: "Not found" });
    return res.json({ deleted: true });
  } catch (e) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

export default router;
