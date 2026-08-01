import { z } from "zod";

const contactFields = {
  name: z.string().trim().min(2).max(100),
  phone: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().trim().min(1).max(30).optional(),
  ),
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
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
).refine((contact) => contact.phone === undefined || contact.phone.length > 0, {
  message: "Phone number cannot be blank.",
  path: ["phone"],
}).refine((contact) => contact.email === undefined || contact.email.length > 0, {
  message: "Email address cannot be blank.",
  path: ["email"],
});

export type ContactInput = z.infer<typeof contactSchema>;
