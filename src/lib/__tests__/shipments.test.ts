import type { CustomerShipment } from "@geekbase-labs/shared-types";

import { apiFetch } from "../api-client";
import {
  formatScanTime,
  parcelHeading,
  scanDetail,
  shipmentStatusLabel,
  trackedShipments,
} from "../shipment-status";
import { listOrderShipments } from "../shipping-api";

jest.mock("../api-client");

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const ORDER_ID = "11111111-1111-4111-8111-111111111111";

function parcel(overrides: Partial<CustomerShipment> = {}): CustomerShipment {
  return {
    id: "44444444-4444-4444-8444-444444444444",
    status: "in_transit",
    awb: "1234567890",
    bookedAt: "2026-09-23T09:00:00.000Z",
    deliveredAt: null,
    items: [
      { orderItemId: "22222222-2222-4222-8222-222222222222", name: "Engraved Lamp", quantity: 2 },
    ],
    events: [],
    ...overrides,
  };
}

describe("listOrderShipments", () => {
  beforeEach(() => jest.clearAllMocks());

  it("asks for the shopper's own parcels in an order", async () => {
    mockApiFetch.mockResolvedValue({ shipments: [parcel()] });

    const shipments = await listOrderShipments(ORDER_ID);

    expect(mockApiFetch).toHaveBeenCalledWith(`/api/shipping/orders/${ORDER_ID}`);
    expect(shipments).toEqual([parcel()]);
  });
});

describe("trackedShipments", () => {
  it("keeps only parcels that have been handed to the courier", () => {
    const kept = trackedShipments([
      parcel({ id: "a", status: "draft" }),
      parcel({ id: "b", status: "booked" }),
      parcel({ id: "c", status: "cancelled" }),
      parcel({ id: "d", status: "delivered" }),
    ]);
    expect(kept.map((s) => s.id)).toEqual(["b", "d"]);
  });
});

describe("shipment wording", () => {
  it("names every status in the shopper's words", () => {
    expect(shipmentStatusLabel("out_for_delivery")).toBe("Out for delivery");
    expect(shipmentStatusLabel("returning")).toBe("Returning to seller");
  });

  it("numbers a parcel only when the order has more than one", () => {
    expect(parcelHeading(0, 1, "in_transit")).toBe("In transit");
    expect(parcelHeading(1, 2, "delivered")).toBe("Parcel 2 of 2 · Delivered");
  });

  it("dates a scan in India time", () => {
    expect(formatScanTime("2026-09-24T09:00:00.000Z")).toBe("24 Sept, 2:30 pm");
  });

  it("joins a scan's place and time, skipping a missing place", () => {
    const event = {
      status: "In Transit",
      statusType: "UD",
      location: "Bengaluru Hub",
      instructions: null,
      scannedAt: "2026-09-24T09:00:00.000Z",
    };
    expect(scanDetail(event)).toBe("Bengaluru Hub · 24 Sept, 2:30 pm");
    expect(scanDetail({ ...event, location: null })).toBe("24 Sept, 2:30 pm");
  });
});
