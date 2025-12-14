import { z } from "zod";

const emailField = z.string().email();

const timingFields = {
  startDateTime: z.coerce.date({ invalid_type_error: "Start time is required" }),
  endDateTime: z.coerce.date({ invalid_type_error: "End time is required" }),
};

export const adminReservationCreateSchema = z.object({
  userEmail: emailField,
  slotId: z.string().trim().min(1, "Slot is required"),
  ...timingFields,
  notes: z.string().optional().default(""),
});

export const adminReservationUpdateSchema = z.object({
  userEmail: emailField.optional(),
  slotId: z.string().trim().min(1).optional(),
  startDateTime: timingFields.startDateTime.optional(),
  endDateTime: timingFields.endDateTime.optional(),
  notes: z.string().optional(),
});

export const userReservationCreateSchema = z.object({
  slotId: z.string().trim().min(1, "Slot is required"),
  ...timingFields,
  notes: z.string().optional().default(""),
});

export const userReservationUpdateSchema = z.object({
  slotId: z.string().trim().min(1).optional(),
  startDateTime: timingFields.startDateTime.optional(),
  endDateTime: timingFields.endDateTime.optional(),
  notes: z.string().optional(),
});
