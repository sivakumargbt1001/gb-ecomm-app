import type { CustomerShipment } from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";

// The shopper's own order only; the API answers 404 for anyone else's.
export async function listOrderShipments(orderId: string): Promise<CustomerShipment[]> {
  const data = await apiFetch<{ shipments: CustomerShipment[] }>(
    `/api/shipping/orders/${encodeURIComponent(orderId)}`,
  );
  return data.shipments;
}
