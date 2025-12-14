import { z } from "zod";

const emailField = z.string().email();

export const adminReservationCreateSchema = z.object({
  userEmail: emailField,
  slotId: z.string().trim().min(1, "Slot is required"),
  notes: z.string().optional().default(""),
});

export const adminReservationUpdateSchema = z.object({
  userEmail: emailField.optional(),
  slotId: z.string().trim().min(1).optional(),
  notes: z.string().optional(),
});

export const userReservationCreateSchema = z.object({
  slotId: z.string().trim().min(1, "Slot is required"),
  notes: z.string().optional().default(""),
});

export const userReservationUpdateSchema = z.object({
  slotId: z.string().trim().min(1).optional(),
  notes: z.string().optional(),
});
