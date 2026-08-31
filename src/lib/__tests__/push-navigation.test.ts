import { orderRouteForPushUrl } from "../push-navigation";

describe("orderRouteForPushUrl", () => {
  // The backend addresses the website (/orders/:id); the app's own route for
  // the same order is singular.
  it("maps a store order link to the app's order route", () => {
    expect(
      orderRouteForPushUrl(
        "https://pimkart.com/orders/3f1a0c2e-9d84-4f1b-9b6a-2c5e7a10d4f8",
      ),
    ).toBe("/order/3f1a0c2e-9d84-4f1b-9b6a-2c5e7a10d4f8");
  });

  it("ignores the host, which differs per environment", () => {
    expect(orderRouteForPushUrl("http://localhost:3000/orders/abc")).toBe(
      "/order/abc",
    );
  });

  // A shipped push carries the courier's own tracking link; that is not a
  // screen this app has, so the tap should leave the shopper where they are.
  it("has no route for a courier tracking link", () => {
    expect(
      orderRouteForPushUrl("https://track.delhivery.com/p/ABC123"),
    ).toBeNull();
  });

  it("has no route for a missing or unparseable url", () => {
    expect(orderRouteForPushUrl(undefined)).toBeNull();
    expect(orderRouteForPushUrl("not a url")).toBeNull();
    expect(orderRouteForPushUrl("https://pimkart.com/orders/")).toBeNull();
  });
});
