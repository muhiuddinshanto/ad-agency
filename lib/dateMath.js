const DAY_MS = 1000 * 60 * 60 * 24;

export function toUtcDay(dateValue) {
  const date = new Date(dateValue);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function getInclusiveDurationInDays(startDate, endDate) {
  const start = toUtcDay(startDate);
  const end = toUtcDay(endDate);
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1);
}
