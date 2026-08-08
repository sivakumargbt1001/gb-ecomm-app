import { apiFetch } from "../api-client";
import { getOrder, listOrders, reorder } from "../order-api";

jest.mock("../api-client");

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const ORDER_ID = "11111111-1111-4111-8111-111111111111";

const MOCK_ORDER = {
  id: ORDER_ID,
  status: "paid",
  totalInPaise: 90000,
  items: [],
};

const MOCK_CART = {
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  contactEmail: null,
  contactPhone: null,
  whatsappOptIn: false,
  items: [],
  subtotalInPaise: 0,
};

describe("order-api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("listOrders unwraps the orders array", async () => {
    mockApiFetch.mockResolvedValue({ orders: [MOCK_ORDER] });

    const orders = await listOrders();

    expect(mockApiFetch).toHaveBeenCalledWith("/api/orders");
    expect(orders).toEqual([MOCK_ORDER]);
  });

  it("getOrder requests a single order by id", async () => {
    mockApiFetch.mockResolvedValue({ order: MOCK_ORDER });

    const order = await getOrder(ORDER_ID);

    expect(mockApiFetch).toHaveBeenCalledWith(`/api/orders/${ORDER_ID}`);
    expect(order).toEqual(MOCK_ORDER);
  });

  it("getOrder encodes the id into the path", async () => {
    mockApiFetch.mockResolvedValue({ order: MOCK_ORDER });

    await getOrder("weird id/../x");

    expect(mockApiFetch).toHaveBeenCalledWith(
      `/api/orders/${encodeURIComponent("weird id/../x")}`,
    );
  });

  it("reorder POSTs and returns the rebuilt cart", async () => {
    mockApiFetch.mockResolvedValue({ cart: MOCK_CART });

    const cart = await reorder(ORDER_ID);

    expect(mockApiFetch).toHaveBeenCalledWith(
      `/api/orders/${ORDER_ID}/reorder`,
      { method: "POST" },
    );
    expect(cart).toEqual(MOCK_CART);
  });

  it("propagates API failures instead of swallowing them", async () => {
    mockApiFetch.mockRejectedValue(new Error("API request failed: 404 Not Found"));

    await expect(getOrder(ORDER_ID)).rejects.toThrow("404");
  });
});
