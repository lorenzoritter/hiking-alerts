import { z } from "zod";

export const hikeSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(10_000),
});

export const hikeUpdateSchema = hikeSchema.partial().refine(
  (hike) => hike.title !== undefined || hike.description !== undefined,
  { message: "Provide a title or description to update." },
);
