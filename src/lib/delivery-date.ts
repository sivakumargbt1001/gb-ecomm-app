// "Sat, 19 Sep" for a delivery estimate that many days out.
export function deliveryDateLabel(daysFromNow: number, now = new Date()): string {
  const date = new Date(now);
  date.setDate(date.getDate() + daysFromNow);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
