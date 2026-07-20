import { apiFetch } from "../api-client";
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  setCartContact,
  mergeGuestCart,
  checkout,
  listAddresses,
  createAddress,
  uploadOptionFile,
} from "../cart-api";
import { getGuestId } from "../guest-id";

jest.mock("../api-client");
jest.mock("../guest-id");

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;
const mockGetGuestId = getGuestId as jest.MockedFunction<typeof getGuestId>;

const GUEST_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const MOCK_CART = {
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  contactEmail: null,
  contactPhone: null,
  whatsappOptIn: false,
  items: [],
  subtotalInPaise: 0,
};

describe("cart-api", () => {
  beforeEach(() => {
    mockGetGuestId.mockResolvedValue(GUEST_ID);
    jest.clearAllMocks();
    mockGetGuestId.mockResolvedValue(GUEST_ID);
  });

  it("getCart sends X-Guest-Id and returns the cart", async () => {
    mockApiFetch.mockResolvedValue({ cart: MOCK_CART });

    const cart = await getCart();

    expect(mockApiFetch).toHaveBeenCalledWith("/api/cart", {
      headers: { "X-Guest-Id": GUEST_ID },
    });
    expect(cart).toEqual(MOCK_CART);
  });

  it("addCartItem sends POST with body and guest header", async () => {
    mockApiFetch.mockResolvedValue({ cart: MOCK_CART });

    const input = { productId: "p1", quantity: 2, customOptionValues: {} };
    await addCartItem(input);

    expect(mockApiFetch).toHaveBeenCalledWith("/api/cart/items", {
      method: "POST",
      body: input,
      headers: { "X-Guest-Id": GUEST_ID },
    });
  });

  it("updateCartItem sends PATCH with quantity", async () => {
    mockApiFetch.mockResolvedValue({ cart: MOCK_CART });

    await updateCartItem("item-1", 5);

    expect(mockApiFetch).toHaveBeenCalledWith("/api/cart/items/item-1", {
      method: "PATCH",
      body: { quantity: 5 },
      headers: { "X-Guest-Id": GUEST_ID },
    });
  });

  it("removeCartItem sends DELETE", async () => {
    mockApiFetch.mockResolvedValue({ cart: MOCK_CART });

    await removeCartItem("item-1");

    expect(mockApiFetch).toHaveBeenCalledWith("/api/cart/items/item-1", {
      method: "DELETE",
      headers: { "X-Guest-Id": GUEST_ID },
    });
  });

  it("setCartContact sends PATCH with contact data", async () => {
    mockApiFetch.mockResolvedValue({ cart: MOCK_CART });

    const input = { contactEmail: "a@b.com", whatsappOptIn: true };
    await setCartContact(input);

    expect(mockApiFetch).toHaveBeenCalledWith("/api/cart/contact", {
      method: "PATCH",
      body: input,
      headers: { "X-Guest-Id": GUEST_ID },
    });
  });

  it("mergeGuestCart sends POST with guest header", async () => {
    mockApiFetch.mockResolvedValue({ cart: MOCK_CART });

    await mergeGuestCart();

    expect(mockApiFetch).toHaveBeenCalledWith("/api/cart/merge", {
      method: "POST",
      headers: { "X-Guest-Id": GUEST_ID },
    });
  });

  it("checkout sends POST and returns CheckoutResult", async () => {
    const result = {
      order: { id: "o1" },
      razorpay: { orderId: "r1", amountInPaise: 1000, currency: "INR", keyId: "k1" },
    };
    mockApiFetch.mockResolvedValue(result);

    const input = {
      shippingAddress: {
        fullName: "Test",
        phone: "+919876543210",
        line1: "123 St",
        city: "Mumbai",
        state: "MH",
        postalCode: "400001",
        country: "IN",
      },
    };
    const res = await checkout(input);

    expect(mockApiFetch).toHaveBeenCalledWith("/api/cart/checkout", {
      method: "POST",
      body: input,
      headers: { "X-Guest-Id": GUEST_ID },
    });
    expect(res).toEqual(result);
  });

  it("listAddresses sends GET without guest header", async () => {
    mockApiFetch.mockResolvedValue({ addresses: [] });

    const addresses = await listAddresses();

    expect(mockApiFetch).toHaveBeenCalledWith("/api/cart/addresses");
    expect(addresses).toEqual([]);
  });

  it("createAddress sends POST with body", async () => {
    const addr = { id: "a1", fullName: "Test" };
    mockApiFetch.mockResolvedValue({ address: addr });

    const input = {
      fullName: "Test",
      phone: "+919876543210",
      line1: "123 St",
      city: "Mumbai",
      state: "MH",
      postalCode: "400001",
      country: "IN",
    };
    const result = await createAddress(input);

    expect(mockApiFetch).toHaveBeenCalledWith("/api/cart/addresses", {
      method: "POST",
      body: input,
    });
    expect(result).toEqual(addr);
  });

  it("uploadOptionFile sends FormData via raw fetch", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ url: "https://r2.example.com/file.png", key: "file.png" }),
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse) as unknown as typeof fetch;

    const result = await uploadOptionFile({
      uri: "file:///photo.png",
      name: "photo.png",
      type: "image/png",
    });

    expect(result).toEqual({ url: "https://r2.example.com/file.png", key: "file.png" });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/cart/uploads"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});
