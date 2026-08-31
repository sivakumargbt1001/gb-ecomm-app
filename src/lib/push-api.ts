import type { PushDevice, RegisterPushDevice } from "@geekbase-labs/shared-types";

import { apiFetch } from "./api-client";

// Devices belong to a signed-in shopper, so these ride the auth token the api
// client already carries.
export async function registerPushDevice(
  input: RegisterPushDevice,
): Promise<PushDevice> {
  const data = await apiFetch<{ device: PushDevice }>(
    "/api/notifications/devices",
    { method: "POST", body: input },
  );
  return data.device;
}

export async function listPushDevices(): Promise<PushDevice[]> {
  const data = await apiFetch<{ devices: PushDevice[] }>(
    "/api/notifications/devices",
  );
  return data.devices;
}

export async function removePushDevice(token: string): Promise<void> {
  // An Expo token is wrapped in brackets, which would not survive a raw path.
  await apiFetch(`/api/notifications/devices/${encodeURIComponent(token)}`, {
    method: "DELETE",
  });
}
