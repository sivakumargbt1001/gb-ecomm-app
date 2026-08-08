import type { Order, OrderStatus } from "@geekbase-labs/shared-types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Order placed",
  paid: "Payment confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function orderStatusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status];
}

const TRACKED_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "delivered",
];

export type TimelineState = "done" | "current" | "upcoming";

export interface TimelineStep {
  status: OrderStatus;
  label: string;
  state: TimelineState;
}

// A cancelled order left the happy path at an unrecorded point, so drawing it
// against the four normal stages would imply progress it never made.
export function orderTimeline(status: OrderStatus): TimelineStep[] {
  if (status === "cancelled") {
    return [{ status, label: orderStatusLabel(status), state: "current" }];
  }

  const reached = TRACKED_STATUSES.indexOf(status);
  return TRACKED_STATUSES.map((step, index) => ({
    status: step,
    label: orderStatusLabel(step),
    state: index < reached ? "done" : index === reached ? "current" : "upcoming",
  }));
}

export function orderItemCount(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function formatOrderDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
