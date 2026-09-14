import type { DeliveryQuote } from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";

// Public: open to guests, since a shopper checks this before signing in.
export function lookupDelivery(pincode: string): Promise<{ quote: DeliveryQuote }> {
  return apiFetch<{ quote: DeliveryQuote }>(
    `/api/delivery/lookup?pincode=${encodeURIComponent(pincode)}`,
  );
}

// What the header shows once a location is chosen: locality, city, state —
// the way a shopper thinks of where they live, rather than the number the
// store prices by.
export type PlacedPincode = { pincode: string; place: string | null };

function joinPlace(parts: (string | undefined)[]): string | null {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const part of parts) {
    const value = part?.trim();
    if (value && !seen.has(value.toLowerCase())) {
      seen.add(value.toLowerCase());
      kept.push(value);
    }
  }
  return kept.length > 0 ? kept.join(", ") : null;
}

// Turns a device position into the pincode the store actually prices by.
// OpenStreetMap's public geocoder answers this without a key; it asks callers
// to stay under one request a second, which a button press honours. Resolves
// null when the spot has no postcode on the map, which the caller reports
// rather than guessing.
export async function pincodeFromCoordinates(
  latitude: number,
  longitude: number,
): Promise<PlacedPincode | null> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "18",
    addressdetails: "1",
  });
  // Nominatim's usage policy asks every client to identify itself, and it
  // refuses the generic user agent a native app sends by default — which
  // read, from the shopper's side, as the location never being found.
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "Pimkart-app/1.0 (delivery pincode lookup)",
      },
    },
  );
  if (!res.ok) throw new Error(`Reverse geocoding failed with ${res.status}`);
  const body = (await res.json()) as {
    address?: Record<string, string | undefined>;
  };
  const address = body.address ?? {};
  const pincode = address.postcode?.replace(/\D/g, "") ?? "";
  if (pincode.length !== 6) return null;
  return {
    pincode,
    place: joinPlace([
      address.neighbourhood ?? address.suburb ?? address.village ?? address.hamlet,
      address.city ?? address.town ?? address.county ?? address.state_district,
      address.state,
    ]),
  };
}

// Names a typed pincode, from India Post's public directory. Best effort: a
// pincode it does not know is still a perfectly good pincode, so this never
// throws and the caller falls back to showing the number.
export async function describePincode(pincode: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as {
      Status?: string;
      PostOffice?: { Name?: string; District?: string; State?: string }[] | null;
    }[];
    const office = body[0]?.PostOffice?.[0];
    if (body[0]?.Status !== "Success" || !office) return null;
    return joinPlace([office.Name, office.District, office.State]);
  } catch {
    return null;
  }
}
