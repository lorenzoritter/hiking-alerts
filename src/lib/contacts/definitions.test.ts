import assert from "node:assert/strict";
import test from "node:test";

import { contactSchema, contactUpdateSchema } from "@/lib/contacts/definitions";

test("requires a usable notification channel when creating a contact", () => {
  assert.equal(contactSchema.safeParse({ name: "Alex", phone: "   " }).success, false);
  assert.equal(contactSchema.safeParse({ name: "Alex", phone: "   ", email: "alex@example.com" }).success, false);
  assert.equal(contactSchema.safeParse({ name: "Alex", email: "alex@example.com" }).success, true);
});

test("rejects blank channels in partial updates", () => {
  assert.equal(contactUpdateSchema.safeParse({ phone: "   " }).success, false);
  assert.equal(contactUpdateSchema.safeParse({ email: "   " }).success, false);
  assert.equal(contactUpdateSchema.safeParse({ name: "Alex" }).success, true);
});
