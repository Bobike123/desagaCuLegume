export function utcDayStartIso(now = new Date()) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString();
}

export function isCampaignReadyToSend(scheduledAt: string | null | undefined, now = new Date()) {
  if (!scheduledAt) return true;

  const scheduledTime = new Date(scheduledAt).getTime();
  return Number.isFinite(scheduledTime) && scheduledTime <= now.getTime();
}
