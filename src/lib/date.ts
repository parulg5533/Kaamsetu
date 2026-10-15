/** Formats a Date as YYYY-MM-DD using the *local* calendar day (not UTC). */
export function localISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns the local date `days` days from `d` as YYYY-MM-DD. */
export function addDaysISO(days: number, d: Date = new Date()): string {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  return localISODate(copy);
}
