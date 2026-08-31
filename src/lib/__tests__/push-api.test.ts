import { apiFetch } from "../api-client";
import { listPushDevices, registerPushDevice, removePushDevice } from "../push-api";

jest.mock("../api-client");

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const DEVICE = {
  id: "3f1a0c2e-9d84-4f1b-9b6a-2c5e7a10d4f8",
  token: "ExponentPushToken[abc123]",
  platform: "ios" as const,
  createdAt: "2026-08-31T09:00:00.000Z",
  lastSeenAt: "2026-08-31T09:00:00.000Z",
};

describe("push-api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registerPushDevice posts the token and unwraps the device", async () => {
    mockApiFetch.mockResolvedValue({ device: DEVICE });

    expect(
      await registerPushDevice({ token: DEVICE.token, platform: "ios" }),
    ).toEqual(DEVICE);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/notifications/devices", {
      method: "POST",
      body: { token: DEVICE.token, platform: "ios" },
    });
  });

  it("listPushDevices unwraps the collection", async () => {
    mockApiFetch.mockResolvedValue({ devices: [DEVICE] });

    expect(await listPushDevices()).toEqual([DEVICE]);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/notifications/devices");
  });

  // Expo tokens carry brackets, which would otherwise break the path segment.
  it("removePushDevice escapes the token in the path", async () => {
    mockApiFetch.mockResolvedValue(undefined);

    await removePushDevice(DEVICE.token);

    expect(mockApiFetch).toHaveBeenCalledWith(
      `/api/notifications/devices/${encodeURIComponent(DEVICE.token)}`,
      { method: "DELETE" },
    );
  });
});
