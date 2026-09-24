import type { DeliveryQuote } from "@geekbase-labs/shared-types";

import { deliveryDateLabel } from "./delivery-date";

// Delhivery names a district and a state code for most pincodes, but not all,
// so the heading keeps whichever parts it has.
export function quotePlaceLabel(
  quote: Pick<DeliveryQuote, "city" | "state" | "pincode">,
): string {
  const place = [quote.city, quote.state].filter(Boolean).join(", ");
  return place ? `${place} · ${quote.pincode}` : quote.pincode;
}

// Null until the courier gives an estimate: a missing one is not same-day.
export function quoteEstimateLabel(quote: Pick<DeliveryQuote, "estimatedDays">): string | null {
  const days = quote.estimatedDays;
  if (days === null) return null;
  if (days === 0) return "Same-day delivery";
  if (days === 1) return "Delivery in 1 day";
  return `Delivery in ${days} days`;
}

export function quoteArrivalDate(
  quote: Pick<DeliveryQuote, "estimatedDays">,
  now = new Date(),
): string | null {
  return quote.estimatedDays === null ? null : deliveryDateLabel(quote.estimatedDays, now);
}
