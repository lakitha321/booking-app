import { z } from "zod";

export const slotCreateSchema = z.object({
  model: z.string().trim().min(1, "Model is required"),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  notes: z.string().optional().default(""),
  isActive: z.boolean().optional().default(true),
});

export const slotUpdateSchema = slotCreateSchema.partial();
