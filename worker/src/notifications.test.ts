import assert from "node:assert/strict";
import test from "node:test";

import { buildNotificationRecords } from "./notifications.js";

test("notification purposes produce distinct idempotency keys", () => {
  const recipient = [{ adventureId: "adventure-1", phone: "+15551234567", email: null }];
  const share = buildNotificationRecords(recipient, "HIKER_PING");
  const alert = buildNotificationRecords(recipient, "CONTACT_ALERT");
  assert.notEqual(share[0]?.deliveryKey, alert[0]?.deliveryKey);
  assert.equal(share[0]?.recipient, "***4567");
});
