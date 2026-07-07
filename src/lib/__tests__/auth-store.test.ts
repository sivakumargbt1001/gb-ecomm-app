import { useAuthStore } from "../auth-store";

describe("auth-store", () => {
  afterEach(() => {
    useAuthStore.setState({ user: null, status: "loading" });
  });

  it("defaults to loading status with no user", () => {
    expect(useAuthStore.getState().status).toBe("loading");
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("setUser marks the store authenticated when given a user", () => {
    const user = {
      id: "11111111-1111-4111-8111-111111111111",
      email: "shopper@example.com",
      phone: null,
      emailVerified: false,
      phoneVerified: false,
      role: "customer" as const,
      createdAt: "2026-07-02T00:00:00.000Z",
    };

    useAuthStore.getState().setUser(user);

    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it("setUser(null) marks the store guest", () => {
    useAuthStore.getState().setUser(null);

    expect(useAuthStore.getState().status).toBe("guest");
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("logout clears the user and marks guest", () => {
    useAuthStore.setState({
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        email: "shopper@example.com",
        phone: null,
        emailVerified: false,
        phoneVerified: false,
        role: "customer",
        createdAt: "2026-07-02T00:00:00.000Z",
      },
      status: "authenticated",
    });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().status).toBe("guest");
    expect(useAuthStore.getState().user).toBeNull();
  });
});
