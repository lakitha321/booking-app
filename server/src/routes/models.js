import express from "express";
import Model from "../models/Model.js";
import { modelCreateSchema, modelUpdateSchema } from "../validation/modelSchema.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const parsed = modelCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const existing = await Model.findOne({ name: parsed.data.name.trim() });
    if (existing) return res.status(409).json({ error: "Model name must be unique" });

    const model = await Model.create(parsed.data);
    return res.status(201).json(model);
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/", async (_req, res) => {
  try {
    const models = await Model.find({}).sort({ name: 1 });
    return res.json(models);
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const model = await Model.findById(req.params.id);
    if (!model) return res.status(404).json({ error: "Not found" });
    return res.json(model);
  } catch (e) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const parsed = modelUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    if (parsed.data.name) {
      const conflict = await Model.findOne({ name: parsed.data.name.trim(), _id: { $ne: req.params.id } });
      if (conflict) return res.status(409).json({ error: "Model name must be unique" });
    }

    const model = await Model.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
    if (!model) return res.status(404).json({ error: "Not found" });
    return res.json(model);
  } catch (e) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const model = await Model.findByIdAndDelete(req.params.id);
    if (!model) return res.status(404).json({ error: "Not found" });
    return res.json({ deleted: true });
  } catch (e) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

export default router;
