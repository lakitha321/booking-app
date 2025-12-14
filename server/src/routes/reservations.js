import express from "express";
import Reservation from "../models/Reservation.js";
import Slot from "../models/Slot.js";
import User from "../models/User.js";
import requireAuth from "../middleware/requireAuth.js";
import {
  adminReservationCreateSchema,
  adminReservationUpdateSchema,
  userReservationCreateSchema,
  userReservationUpdateSchema,
} from "../validation/reservationSchema.js";

const router = express.Router();

async function hydrateReservation(slotId, userId, notes) {
  const slot = await Slot.findById(slotId).populate("model");
  if (!slot) return { error: { code: 404, message: "Slot not found" } };
  if (!slot.isActive) return { error: { code: 400, message: "Slot is not active" } };

  const existing = await Reservation.findOne({ slot: slot._id });
  if (existing) return { error: { code: 409, message: "Slot already reserved" } };

  const user = await User.findById(userId);
  if (!user) return { error: { code: 404, message: "User not found" } };

  return {
    slot,
    user,
    reservation: {
      user: user._id,
      userName: `${user.firstName} ${user.lastName}`.trim(),
      userEmail: user.email,
      model: slot.model?._id || slot.model,
      slot: slot._id,
      startDateTime: slot.startDateTime,
      endDateTime: slot.endDateTime,
      notes: notes ?? "",
    },
  };
}

function populateReservation(query) {
  return query.populate("user").populate("model").populate({ path: "slot", populate: "model" });
}

router.post("/my", requireAuth, async (req, res) => {
  try {
    const parsed = userReservationCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const hydrated = await hydrateReservation(parsed.data.slotId, req.userId, parsed.data.notes);
    if (hydrated.error) return res.status(hydrated.error.code).json({ error: hydrated.error.message });

    const reservation = await Reservation.create(hydrated.reservation);
    await reservation.populate(["user", "model", { path: "slot", populate: "model" }]);
    return res.status(201).json(reservation);
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/my/list", requireAuth, async (req, res) => {
  try {
    const reservations = await populateReservation(
      Reservation.find({ user: req.userId }).sort({ startDateTime: 1 })
    );
    return res.json(await reservations);
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.put("/my/:id", requireAuth, async (req, res) => {
  try {
    const parsed = userReservationUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const reservation = await Reservation.findOne({ _id: req.params.id, user: req.userId });
    if (!reservation) return res.status(404).json({ error: "Not found" });

    if (parsed.data.slotId) {
      const slot = await Slot.findById(parsed.data.slotId);
      if (!slot) return res.status(404).json({ error: "Slot not found" });
      if (!slot.isActive) return res.status(400).json({ error: "Slot is not active" });
      const conflict = await Reservation.findOne({ _id: { $ne: reservation._id }, slot: slot._id });
      if (conflict) return res.status(409).json({ error: "Slot already reserved" });
      reservation.slot = slot._id;
      reservation.model = slot.model;
      reservation.startDateTime = slot.startDateTime;
      reservation.endDateTime = slot.endDateTime;
    }

    if (parsed.data.notes !== undefined) reservation.notes = parsed.data.notes;

    await reservation.save();
    await reservation.populate(["user", "model", { path: "slot", populate: "model" }]);
    return res.json(reservation);
  } catch (e) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

router.delete("/my/:id", requireAuth, async (req, res) => {
  try {
    const reservation = await Reservation.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!reservation) return res.status(404).json({ error: "Not found" });
    return res.json({ deleted: true });
  } catch (e) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = adminReservationCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const user = await User.findOne({ email: parsed.data.userEmail.toLowerCase() });
    if (!user) return res.status(404).json({ error: "User not found" });

    const hydrated = await hydrateReservation(parsed.data.slotId, user._id, parsed.data.notes);
    if (hydrated.error) return res.status(hydrated.error.code).json({ error: hydrated.error.message });

    const reservation = await Reservation.create(hydrated.reservation);
    await reservation.populate(["user", "model", { path: "slot", populate: "model" }]);
    return res.status(201).json(reservation);
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/", async (_req, res) => {
  try {
    const reservations = await populateReservation(Reservation.find({}).sort({ startDateTime: 1 }));
    return res.json(await reservations);
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const reservation = await populateReservation(Reservation.findById(req.params.id));
    const doc = await reservation;
    if (!doc) return res.status(404).json({ error: "Not found" });
    return res.json(doc);
  } catch (e) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const parsed = adminReservationUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ error: "Not found" });

    if (parsed.data.userEmail) {
      const user = await User.findOne({ email: parsed.data.userEmail.toLowerCase() });
      if (!user) return res.status(404).json({ error: "User not found" });
      reservation.user = user._id;
      reservation.userEmail = user.email;
      reservation.userName = `${user.firstName} ${user.lastName}`.trim();
    }

    if (parsed.data.slotId) {
      const slot = await Slot.findById(parsed.data.slotId);
      if (!slot) return res.status(404).json({ error: "Slot not found" });
      if (!slot.isActive) return res.status(400).json({ error: "Slot is not active" });
      const conflict = await Reservation.findOne({ _id: { $ne: reservation._id }, slot: slot._id });
      if (conflict) return res.status(409).json({ error: "Slot already reserved" });
      reservation.slot = slot._id;
      reservation.model = slot.model;
      reservation.startDateTime = slot.startDateTime;
      reservation.endDateTime = slot.endDateTime;
    }

    if (parsed.data.notes !== undefined) reservation.notes = parsed.data.notes;

    await reservation.save();
    await reservation.populate(["user", "model", { path: "slot", populate: "model" }]);
    return res.json(reservation);
  } catch (e) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) return res.status(404).json({ error: "Not found" });
    return res.json({ deleted: true });
  } catch (e) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

export default router;
