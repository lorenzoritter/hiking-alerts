import { z } from "zod";

export const acknowledgeSchema = z.object({
  expectedReturnAtLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
});
