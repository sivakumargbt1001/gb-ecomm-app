import type { CustomerShipment } from "@geekbase-labs/shared-types";
import { Text, View } from "react-native";

import { parcelHeading, scanDetail, trackedShipments } from "../../lib/shipment-status";

// The courier's scans for each parcel, newest first as the API sends them,
// in Delhivery's own words.
export function ShipmentTimelines({ shipments }: { shipments: CustomerShipment[] }) {
  const tracked = trackedShipments(shipments);
  if (tracked.length === 0) return null;

  return (
    <View className="border-t border-neutral-100 px-4 py-4" testID="order-shipments">
      <Text className="text-base font-semibold text-neutral-900">Tracking</Text>
      {tracked.map((shipment, index) => (
        <View
          key={shipment.id}
          className="mt-3 rounded-lg border border-neutral-200 p-3"
          testID="order-shipment"
        >
          <Text className="text-sm font-semibold text-neutral-900">
            {parcelHeading(index, tracked.length, shipment.status)}
          </Text>
          {shipment.awb ? (
            <Text className="mt-0.5 text-xs text-neutral-500">Delhivery {shipment.awb}</Text>
          ) : null}
          <Text className="mt-1 text-sm text-neutral-600">
            {shipment.items.map((item) => `${item.quantity} × ${item.name}`).join(", ")}
          </Text>
          {shipment.events.length === 0 ? (
            <Text className="mt-2 text-sm text-neutral-500">No courier scans yet.</Text>
          ) : (
            <View className="mt-2 gap-2 border-l border-neutral-200 pl-3">
              {shipment.events.map((event, eventIndex) => (
                <View key={`${event.scannedAt}-${event.status}`}>
                  <Text
                    className={
                      eventIndex === 0
                        ? "text-sm font-semibold text-neutral-900"
                        : "text-sm text-neutral-700"
                    }
                  >
                    {event.status}
                  </Text>
                  <Text className="text-xs text-neutral-500">{scanDetail(event)}</Text>
                  {event.instructions ? (
                    <Text className="text-xs text-neutral-500">{event.instructions}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
