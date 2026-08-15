import { apiFetch } from "../api-client";
import {
  addWishlistItem,
  listWishlist,
  removeWishlistItem,
} from "../wishlist-api";

jest.mock("../api-client");

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const PRODUCT_ID = "22222222-2222-4222-8222-222222222222";

const MOCK_ITEM = {
  id: "44444444-4444-4444-8444-444444444444",
  productId: PRODUCT_ID,
  createdAt: "2026-08-02T10:00:00.000Z",
  product: { id: PRODUCT_ID, name: "Engraved Poster", priceInPaise: 50000 },
};

describe("wishlist-api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("listWishlist unwraps the items array", async () => {
    mockApiFetch.mockResolvedValue({ items: [MOCK_ITEM] });

    const items = await listWishlist();

    expect(mockApiFetch).toHaveBeenCalledWith("/api/wishlist");
    expect(items).toEqual([MOCK_ITEM]);
  });

  it("addWishlistItem POSTs the product id and unwraps the saved item", async () => {
    mockApiFetch.mockResolvedValue({ item: MOCK_ITEM });

    const item = await addWishlistItem(PRODUCT_ID);

    expect(mockApiFetch).toHaveBeenCalledWith("/api/wishlist", {
      method: "POST",
      body: { productId: PRODUCT_ID },
    });
    expect(item).toEqual(MOCK_ITEM);
  });

  it("removeWishlistItem DELETEs the product from the caller's wishlist", async () => {
    mockApiFetch.mockResolvedValue(undefined);

    await removeWishlistItem(PRODUCT_ID);

    expect(mockApiFetch).toHaveBeenCalledWith(`/api/wishlist/${PRODUCT_ID}`, {
      method: "DELETE",
    });
  });

  it("removeWishlistItem encodes the product id into the path", async () => {
    mockApiFetch.mockResolvedValue(undefined);

    await removeWishlistItem("weird id/../x");

    expect(mockApiFetch).toHaveBeenCalledWith(
      `/api/wishlist/${encodeURIComponent("weird id/../x")}`,
      { method: "DELETE" },
    );
  });

  it("propagates API failures instead of swallowing them", async () => {
    mockApiFetch.mockRejectedValue(
      new Error("API request failed: 401 Unauthorized"),
    );

    await expect(listWishlist()).rejects.toThrow("401");
  });
});
