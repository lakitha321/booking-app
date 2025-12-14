import { z } from "zod";

export const slotCreateSchema = z.object({
  title: z.string().optional().default(""),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  notes: z.string().optional().default(""),
  isActive: z.boolean().optional().default(true),
});

export const slotUpdateSchema = slotCreateSchema.partial();
