import type { Order } from "@geekbase-labs/shared-types";

import {
  formatOrderDate,
  orderItemCount,
  orderStatusLabel,
  orderTimeline,
} from "../order-status";

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    userId: "22222222-2222-4222-8222-222222222222",
    contactEmail: "shopper@example.com",
    contactPhone: null,
    shippingAddress: {
      fullName: "Asha Rao",
      phone: "+919876543210",
      line1: "1 MG Road",
      line2: null,
      city: "Bengaluru",
      state: "KA",
      postalCode: "560001",
      country: "IN",
    },
    items: [
      {
        id: "33333333-3333-4333-8333-333333333333",
        productId: "44444444-4444-4444-8444-444444444444",
        variantId: null,
        name: "Framed print",
        quantity: 2,
        unitPriceInPaise: 45000,
        customOptionValues: {},
      },
    ],
    status: "paid",
    paymentStatus: "paid",
    subtotalInPaise: 90000,
    totalInPaise: 90000,
    razorpayOrderId: "order_test",
    trackingLink: null,
    courierName: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("orderStatusLabel", () => {
  it("labels every status", () => {
    expect(orderStatusLabel("pending")).toBe("Order placed");
    expect(orderStatusLabel("paid")).toBe("Payment confirmed");
    expect(orderStatusLabel("shipped")).toBe("Shipped");
    expect(orderStatusLabel("delivered")).toBe("Delivered");
    expect(orderStatusLabel("cancelled")).toBe("Cancelled");
  });
});

describe("orderTimeline", () => {
  it("marks earlier stages done, the current one current, later ones upcoming", () => {
    const steps = orderTimeline("shipped");
    expect(steps.map((step) => step.status)).toEqual([
      "pending",
      "paid",
      "shipped",
      "delivered",
    ]);
    expect(steps.map((step) => step.state)).toEqual([
      "done",
      "done",
      "current",
      "upcoming",
    ]);
  });

  it("starts with only the first stage current", () => {
    expect(orderTimeline("pending").map((step) => step.state)).toEqual([
      "current",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
  });

  it("has nothing upcoming once delivered", () => {
    expect(orderTimeline("delivered").map((step) => step.state)).toEqual([
      "done",
      "done",
      "done",
      "current",
    ]);
  });

  it("collapses a cancelled order to a single stage", () => {
    const steps = orderTimeline("cancelled");
    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({ status: "cancelled", state: "current" });
  });
});

describe("orderItemCount", () => {
  it("sums line item quantities", () => {
    expect(orderItemCount(order())).toBe(2);
    expect(
      orderItemCount(
        order({
          items: [
            { ...order().items[0], id: "a", quantity: 1 },
            { ...order().items[0], id: "b", quantity: 3 },
          ],
        }),
      ),
    ).toBe(4);
  });
});

describe("formatOrderDate", () => {
  it("renders an ISO timestamp as a short readable date", () => {
    expect(formatOrderDate("2026-08-01T10:00:00.000Z")).toMatch(/2026/);
  });
});
