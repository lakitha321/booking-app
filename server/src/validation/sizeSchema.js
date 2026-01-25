import { z } from "zod";

export const sizeCreateSchema = z.object({
  name: z.string().trim().min(1, "Size name is required"),
});

export const sizeUpdateSchema = sizeCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);
