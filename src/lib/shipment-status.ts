import type {
  CustomerShipment,
  ShipmentEvent,
  ShipmentStatus,
} from "@geekbase-labs/shared-types";

// The website's wording, so a shopper reads the same thing on both.
const STATUS_LABELS: Record<ShipmentStatus, string> = {
  draft: "Not booked yet",
  booked: "Booked",
  pickup_requested: "Pickup requested",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  returning: "Returning to seller",
  returned: "Returned to seller",
  cancelled: "Cancelled",
};

export function shipmentStatusLabel(status: ShipmentStatus): string {
  return STATUS_LABELS[status];
}

// A draft has not reached the courier and a cancelled parcel never will, so
// neither has anything to track.
export function trackedShipments(shipments: CustomerShipment[]): CustomerShipment[] {
  return shipments.filter((s) => s.status !== "draft" && s.status !== "cancelled");
}

// An order from two sellers travels as two parcels; one parcel needs no number.
export function parcelHeading(index: number, total: number, status: ShipmentStatus): string {
  const label = shipmentStatusLabel(status);
  return total > 1 ? `Parcel ${index + 1} of ${total} · ${label}` : label;
}

export function formatScanTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export function scanDetail(event: ShipmentEvent): string {
  return [event.location, formatScanTime(event.scannedAt)].filter(Boolean).join(" · ");
}
