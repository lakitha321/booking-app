import express from "express";
import Slot from "../models/Slot.js";
import Model from "../models/Model.js";
import { slotCreateSchema, slotUpdateSchema } from "../validation/slotSchema.js";

const router = express.Router();

// Create
router.post("/", async (req, res) => {
  try {
    const parsed = slotCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { startDateTime, endDateTime, modelId, ...rest } = parsed.data;

    const model = await Model.findById(modelId);
    if (!model) return res.status(404).json({ error: "Model not found" });

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (!(start < end)) return res.status(400).json({ error: "startDateTime must be before endDateTime" });

    // (Optional) prevent overlaps for admin "availability blocks"
    // Uncomment if you want strict non-overlapping admin slots:
    const overlap = await Slot.findOne({
      model: model._id,
      isActive: true,
      $or: [
        { startDateTime: { $lt: end }, endDateTime: { $gt: start } }
      ]
    });
    if (overlap) return res.status(409).json({ error: "Overlaps an existing active slot" });

    const slot = await Slot.create({ ...rest, model: model._id, startDateTime: start, endDateTime: end });
    await slot.populate("model");
    return res.status(201).json(slot);
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

// Read all (with optional range filters)
router.get("/", async (req, res) => {
  try {
    const { from, to, active } = req.query;

    const q = {};
    if (active === "true") q.isActive = true;
    if (active === "false") q.isActive = false;

    if (from || to) {
      q.startDateTime = {};
      if (from) q.startDateTime.$gte = new Date(from);
      if (to) q.startDateTime.$lte = new Date(to);
    }

    const slots = await Slot.find(q).populate("model").sort({ startDateTime: 1 });
    return res.json(slots);
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

// Read one
router.get("/:id", async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id).populate("model");
    if (!slot) return res.status(404).json({ error: "Not found" });
    return res.json(slot);
  } catch {
    return res.status(400).json({ error: "Invalid id" });
  }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const parsed = slotUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const update = { ...parsed.data };

    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).json({ error: "Not found" });

    if (update.modelId) {
      const model = await Model.findById(update.modelId);
      if (!model) return res.status(404).json({ error: "Model not found" });
      update.model = model._id;
    }
    delete update.modelId;

    const nextModel = update.model ?? slot.model;
    const nextStart = update.startDateTime ? new Date(update.startDateTime) : slot.startDateTime;
    const nextEnd = update.endDateTime ? new Date(update.endDateTime) : slot.endDateTime;
    const willBeActive = update.isActive ?? slot.isActive;

    if (!(nextStart < nextEnd)) {
      return res.status(400).json({ error: "startDateTime must be before endDateTime" });
    }

    if (willBeActive) {
      const overlap = await Slot.findOne({
        _id: { $ne: slot._id },
        model: nextModel,
        isActive: true,
        startDateTime: { $lt: nextEnd },
        endDateTime: { $gt: nextStart },
      });
      if (overlap) return res.status(409).json({ error: "Overlaps an existing active slot" });
    }

    slot.set({ ...update, startDateTime: nextStart, endDateTime: nextEnd, model: nextModel });
    await slot.save();
    await slot.populate("model");

    return res.json(slot);
  } catch {
    return res.status(400).json({ error: "Invalid id" });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    const slot = await Slot.findByIdAndDelete(req.params.id);
    if (!slot) return res.status(404).json({ error: "Not found" });
    return res.json({ deleted: true });
  } catch {
    return res.status(400).json({ error: "Invalid id" });
  }
});

export default router;
