import { z } from "zod";

const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Use a local date and time.");

export const adventureSchema = z.object({
  hikeId: z.string().min(1),
  startAtLocal: localDateTime.optional(),
  expectedReturnAtLocal: localDateTime,
  timezone: z.string().min(1).max(100),
  contactIds: z.array(z.string().min(1)).min(1).max(20).refine(
    (ids) => new Set(ids).size === ids.length,
    "Choose each contact only once.",
  ),
  pingGraceMinutes: z.number().int().min(0).max(1440).default(30),
  alertGraceMinutes: z.number().int().min(0).max(1440).default(30),
});
