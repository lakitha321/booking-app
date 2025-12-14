import express from "express";
import Slot from "../models/Slot.js";
import { slotCreateSchema, slotUpdateSchema } from "../validation/slotSchema.js";

const router = express.Router();

// Create
router.post("/", async (req, res) => {
  try {
    const parsed = slotCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { startDateTime, endDateTime, ...rest } = parsed.data;

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (!(start < end)) return res.status(400).json({ error: "startDateTime must be before endDateTime" });

    // (Optional) prevent overlaps for admin "availability blocks"
    // Uncomment if you want strict non-overlapping admin slots:
    const overlap = await Slot.findOne({
      isActive: true,
      $or: [
        { startDateTime: { $lt: end }, endDateTime: { $gt: start } }
      ]
    });
    if (overlap) return res.status(409).json({ error: "Overlaps an existing active slot" });

    const slot = await Slot.create({ ...rest, startDateTime: start, endDateTime: end });
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

    const slots = await Slot.find(q).sort({ startDateTime: 1 });
    return res.json(slots);
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

// Read one
router.get("/:id", async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
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

    if (update.startDateTime) update.startDateTime = new Date(update.startDateTime);
    if (update.endDateTime) update.endDateTime = new Date(update.endDateTime);

    if (update.startDateTime && update.endDateTime && !(update.startDateTime < update.endDateTime)) {
      return res.status(400).json({ error: "startDateTime must be before endDateTime" });
    }

    const slot = await Slot.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!slot) return res.status(404).json({ error: "Not found" });

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
