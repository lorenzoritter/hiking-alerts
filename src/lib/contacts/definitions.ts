import { z } from "zod";

const contactFields = {
  name: z.string().trim().min(2).max(100),
  phone: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().max(30).optional(),
  ),
  email: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().email().max(320).optional(),
  ),
  isDefault: z.boolean().default(false),
};

export const contactSchema = z
  .object(contactFields)
  .refine((contact) => Boolean(contact.phone || contact.email), {
    message: "Add a phone number or email address.",
    path: ["phone"],
  });

export const contactUpdateSchema = z.object(contactFields).partial().refine(
  (contact) =>
    contact.phone !== undefined ||
    contact.email !== undefined ||
    contact.name !== undefined ||
    contact.isDefault !== undefined,
  { message: "Provide at least one field to update." },
);

export type ContactInput = z.infer<typeof contactSchema>;
