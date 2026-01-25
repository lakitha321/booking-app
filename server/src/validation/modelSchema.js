import { z } from "zod";

export const modelCreateSchema = z.object({
  name: z.string().trim().min(1, "Model name is required"),
  sizeId: z.string().trim().min(1, "Size is required"),
  notes: z.string().optional().default(""),
});

export const modelUpdateSchema = modelCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);
