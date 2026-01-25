import express from "express";
import mongoose from "mongoose";
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

function validateTimingWithinSlot(slot, start, end) {
  if (!start || Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) {
    return "Invalid start or end time";
  }

  if (!(start < end)) return "startDateTime must be before endDateTime";

  if (start < slot.startDateTime || end > slot.endDateTime) {
    return "Reservation must fall within the slot availability window";
  }

  return null;
}

async function hydrateReservation(slotId, userId, notes, startDateTime, endDateTime) {
  if (!mongoose.Types.ObjectId.isValid(slotId)) {
    return { error: { code: 400, message: "Invalid slot id" } };
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { error: { code: 400, message: "Invalid user id" } };
  }

  const slot = await Slot.findById(slotId).populate("model");
  if (!slot) return { error: { code: 404, message: "Slot not found" } };
  if (!slot.isActive) return { error: { code: 400, message: "Slot is not active" } };

  const modelId = slot.model?._id || slot.model;
  if (!modelId || !mongoose.Types.ObjectId.isValid(modelId)) {
    return { error: { code: 400, message: "Slot is missing a valid model" } };
  }

  const user = await User.findById(userId);
  if (!user) return { error: { code: 404, message: "User not found" } };

  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const timingError = validateTimingWithinSlot(slot, start, end);
  if (timingError) return { error: { code: 400, message: timingError } };

  return {
    slot,
    user,
    reservation: {
      user: user._id,
      userName: `${user.firstName} ${user.lastName}`.trim(),
      userEmail: user.email,
      model: modelId,
      slot: slot._id,
      startDateTime: start,
      endDateTime: end,
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

    const hydrated = await hydrateReservation(
      parsed.data.slotId,
      req.userId,
      parsed.data.notes,
      parsed.data.startDateTime,
      parsed.data.endDateTime
    );
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

    const slot = parsed.data.slotId
      ? await Slot.findById(parsed.data.slotId)
      : await Slot.findById(reservation.slot).populate("model");
    if (!slot) return res.status(404).json({ error: "Slot not found" });
    if (!slot.isActive) return res.status(400).json({ error: "Slot is not active" });

    const modelId = slot.model?._id || slot.model;
    if (!modelId || !mongoose.Types.ObjectId.isValid(modelId)) {
      return res.status(400).json({ error: "Slot is missing a valid model" });
    }

    const nextStart = parsed.data.startDateTime ? new Date(parsed.data.startDateTime) : reservation.startDateTime;
    const nextEnd = parsed.data.endDateTime ? new Date(parsed.data.endDateTime) : reservation.endDateTime;
    const timingError = validateTimingWithinSlot(slot, nextStart, nextEnd);
    if (timingError) return res.status(400).json({ error: timingError });

    reservation.slot = slot._id;
    reservation.model = modelId;
    reservation.startDateTime = nextStart;
    reservation.endDateTime = nextEnd;

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

    const hydrated = await hydrateReservation(
      parsed.data.slotId,
      user._id,
      parsed.data.notes,
      parsed.data.startDateTime,
      parsed.data.endDateTime
    );
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

    const slot = parsed.data.slotId
      ? await Slot.findById(parsed.data.slotId).populate("model")
      : await Slot.findById(reservation.slot).populate("model");
    if (!slot) return res.status(404).json({ error: "Slot not found" });
    if (!slot.isActive) return res.status(400).json({ error: "Slot is not active" });

    const modelId = slot.model?._id || slot.model;
    if (!modelId || !mongoose.Types.ObjectId.isValid(modelId)) {
      return res.status(400).json({ error: "Slot is missing a valid model" });
    }

    const nextStart = parsed.data.startDateTime ? new Date(parsed.data.startDateTime) : reservation.startDateTime;
    const nextEnd = parsed.data.endDateTime ? new Date(parsed.data.endDateTime) : reservation.endDateTime;
    const timingError = validateTimingWithinSlot(slot, nextStart, nextEnd);
    if (timingError) return res.status(400).json({ error: timingError });

    reservation.slot = slot._id;
    reservation.model = modelId;
    reservation.startDateTime = nextStart;
    reservation.endDateTime = nextEnd;

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
