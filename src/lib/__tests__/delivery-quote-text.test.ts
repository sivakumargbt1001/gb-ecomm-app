import type { DeliveryQuote } from "@geekbase-labs/shared-types";

import {
  quoteArrivalDate,
  quoteEstimateLabel,
  quotePlaceLabel,
} from "../delivery-quote-text";

function quote(overrides: Partial<DeliveryQuote> = {}): DeliveryQuote {
  return {
    pincode: "560001",
    serviceable: true,
    notConfigured: false,
    city: "Bengaluru",
    state: "Karnataka",
    deliveryFeeInPaise: 0,
    estimatedDays: 3,
    ...overrides,
  };
}

describe("quotePlaceLabel", () => {
  it("names city, state and pincode when the courier gives both", () => {
    expect(quotePlaceLabel(quote())).toBe("Bengaluru, Karnataka · 560001");
  });

  it("falls back to the pincode alone when the courier names no place", () => {
    expect(quotePlaceLabel(quote({ city: null, state: null }))).toBe("560001");
  });

  it("keeps whichever part the courier did name", () => {
    expect(quotePlaceLabel(quote({ city: null, state: "KA" }))).toBe("KA · 560001");
  });
});

describe("quoteEstimateLabel", () => {
  it("words the estimate in days", () => {
    expect(quoteEstimateLabel(quote({ estimatedDays: 0 }))).toBe("Same-day delivery");
    expect(quoteEstimateLabel(quote({ estimatedDays: 1 }))).toBe("Delivery in 1 day");
    expect(quoteEstimateLabel(quote({ estimatedDays: 4 }))).toBe("Delivery in 4 days");
  });

  it("says nothing rather than same-day when there is no estimate", () => {
    expect(quoteEstimateLabel(quote({ estimatedDays: null }))).toBeNull();
  });
});

describe("quoteArrivalDate", () => {
  const now = new Date("2026-09-24T10:00:00+05:30");

  it("names the date the estimate lands on", () => {
    expect(quoteArrivalDate(quote({ estimatedDays: 3 }), now)).toBe("Sun, 27 Sept");
  });

  it("names no date, rather than today, when there is no estimate", () => {
    expect(quoteArrivalDate(quote({ estimatedDays: null }), now)).toBeNull();
  });
});
