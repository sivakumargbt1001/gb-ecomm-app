import { registerPushDevice, removePushDevice } from "../push-api";
import {
  detachPushDevice,
  pushPlatformFor,
  registerDeviceForPush,
  resolvePushToken,
  unregisterDeviceForPush,
  type PushTokenDeps,
} from "../push-registration";
import { usePushStore } from "../push-store";

jest.mock("../push-api");

const mockRegister = registerPushDevice as jest.MockedFunction<typeof registerPushDevice>;
const mockRemove = removePushDevice as jest.MockedFunction<typeof removePushDevice>;

const TOKEN = "ExponentPushToken[abc123]";

function deps(overrides: Partial<PushTokenDeps> = {}): PushTokenDeps {
  return {
    isPhysicalDevice: true,
    os: "ios",
    getPermissions: jest.fn().mockResolvedValue("granted"),
    requestPermissions: jest.fn().mockResolvedValue("granted"),
    getToken: jest.fn().mockResolvedValue(TOKEN),
    ...overrides,
  };
}

describe("pushPlatformFor", () => {
  it("maps the two platforms the backend accepts", () => {
    expect(pushPlatformFor("ios")).toBe("ios");
    expect(pushPlatformFor("android")).toBe("android");
  });

  it("has no platform for web", () => {
    expect(pushPlatformFor("web")).toBeNull();
  });
});

describe("resolvePushToken", () => {
  it("returns the token when permission is already granted", async () => {
    const d = deps();

    expect(await resolvePushToken(d)).toBe(TOKEN);
    expect(d.requestPermissions).not.toHaveBeenCalled();
  });

  it("asks once when permission is undetermined", async () => {
    const d = deps({ getPermissions: jest.fn().mockResolvedValue("undetermined") });

    expect(await resolvePushToken(d)).toBe(TOKEN);
    expect(d.requestPermissions).toHaveBeenCalledTimes(1);
  });

  it("gives up when the shopper refuses the prompt", async () => {
    const d = deps({
      getPermissions: jest.fn().mockResolvedValue("undetermined"),
      requestPermissions: jest.fn().mockResolvedValue("denied"),
    });

    expect(await resolvePushToken(d)).toBeNull();
    expect(d.getToken).not.toHaveBeenCalled();
  });

  // Re-prompting a shopper who already said no is a setting change on iOS, not
  // a dialog, so asking again only burns a launch.
  it("does not re-prompt a shopper who already denied", async () => {
    const d = deps({ getPermissions: jest.fn().mockResolvedValue("denied") });

    expect(await resolvePushToken(d)).toBeNull();
    expect(d.requestPermissions).not.toHaveBeenCalled();
  });

  it("skips a simulator, which can never be issued a token", async () => {
    const d = deps({ isPhysicalDevice: false });

    expect(await resolvePushToken(d)).toBeNull();
    expect(d.getPermissions).not.toHaveBeenCalled();
  });

  // A missing EAS project id throws here; push is not worth a broken launch.
  it("swallows a token failure", async () => {
    const d = deps({ getToken: jest.fn().mockRejectedValue(new Error("no projectId")) });

    expect(await resolvePushToken(d)).toBeNull();
  });
});

describe("registerDeviceForPush", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePushStore.setState({ token: null });
  });

  it("registers the resolved token against the current platform", async () => {
    expect(await registerDeviceForPush(deps())).toBe(TOKEN);
    expect(mockRegister).toHaveBeenCalledWith({ token: TOKEN, platform: "ios" });
  });

  it("remembers the registered token so logout can drop the row", async () => {
    await registerDeviceForPush(deps());

    expect(usePushStore.getState().token).toBe(TOKEN);
  });

  it("registers nothing when there is no token", async () => {
    const d = deps({ getPermissions: jest.fn().mockResolvedValue("denied") });

    expect(await registerDeviceForPush(d)).toBeNull();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("registers nothing on a platform the backend has no channel for", async () => {
    expect(await registerDeviceForPush(deps({ os: "web" }))).toBeNull();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  // A registration that fails must not take the launch down with it.
  it("reports failure instead of throwing", async () => {
    mockRegister.mockRejectedValue(new Error("API request failed: 401"));

    expect(await registerDeviceForPush(deps())).toBeNull();
  });
});

describe("unregisterDeviceForPush", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // A phone that changes hands must stop receiving the last shopper's orders.
  it("removes the token", async () => {
    await unregisterDeviceForPush(TOKEN);

    expect(mockRemove).toHaveBeenCalledWith(TOKEN);
  });

  it("stays quiet when the device is already gone", async () => {
    mockRemove.mockRejectedValue(new Error("API request failed: 404"));

    await expect(unregisterDeviceForPush(TOKEN)).resolves.toBeUndefined();
  });
});

describe("detachPushDevice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePushStore.setState({ token: TOKEN });
  });

  // This has to run while the shopper is still signed in — the delete needs
  // their auth token, which logging out throws away.
  it("removes the remembered device and forgets it", async () => {
    await detachPushDevice();

    expect(mockRemove).toHaveBeenCalledWith(TOKEN);
    expect(usePushStore.getState().token).toBeNull();
  });

  it("does nothing when this install never registered", async () => {
    usePushStore.setState({ token: null });

    await detachPushDevice();

    expect(mockRemove).not.toHaveBeenCalled();
  });
});
