type EscalationInput = {
  status: string;
  expectedReturnAt: Date;
  pingGraceMinutes: number;
  alertGraceMinutes: number;
};

export function getEscalationTransition(input: EscalationInput, now: Date) {
  const pingAt = new Date(input.expectedReturnAt.getTime() + input.pingGraceMinutes * 60_000);
  const alertAt = new Date(pingAt.getTime() + input.alertGraceMinutes * 60_000);

  if (input.status === "ACTIVE" && now >= pingAt) return { status: "HIKER_PINGED" as const, effectiveDeadline: pingAt };
  if (input.status === "HIKER_PINGED" && now >= alertAt) return { status: "CONTACTS_ALERTED" as const, effectiveDeadline: alertAt };
  return null;
}
