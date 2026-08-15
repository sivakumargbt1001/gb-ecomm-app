import type { WishlistItem } from "@geekbase-labs/shared-types";

import { isProductSaved, withSavedItem, withoutProduct } from "../wishlist";

const PRODUCT_A = "22222222-2222-4222-8222-222222222222";
const PRODUCT_B = "33333333-3333-4333-8333-333333333333";

function item(productId: string, createdAt = "2026-08-02T10:00:00.000Z") {
  return {
    id: `item-${productId}`,
    productId,
    createdAt,
    product: { id: productId, name: `Product ${productId.slice(0, 4)}` },
  } as unknown as WishlistItem;
}

describe("isProductSaved", () => {
  it("finds a saved product", () => {
    expect(isProductSaved([item(PRODUCT_A)], PRODUCT_A)).toBe(true);
  });

  it("is false for a product that is not saved", () => {
    expect(isProductSaved([item(PRODUCT_A)], PRODUCT_B)).toBe(false);
  });

  it("treats a wishlist that has not loaded yet as unsaved", () => {
    expect(isProductSaved(undefined, PRODUCT_A)).toBe(false);
  });
});

describe("withSavedItem", () => {
  it("puts the newly saved product first", () => {
    const list = withSavedItem([item(PRODUCT_A)], item(PRODUCT_B));

    expect(list.map((i) => i.productId)).toEqual([PRODUCT_B, PRODUCT_A]);
  });

  it("does not duplicate a product that was already saved", () => {
    const saved = item(PRODUCT_A, "2026-08-01T10:00:00.000Z");
    const resaved = item(PRODUCT_A, "2026-08-05T10:00:00.000Z");

    const list = withSavedItem([saved, item(PRODUCT_B)], resaved);

    expect(list.map((i) => i.productId)).toEqual([PRODUCT_A, PRODUCT_B]);
    expect(list[0].createdAt).toBe("2026-08-05T10:00:00.000Z");
  });
});

describe("withoutProduct", () => {
  it("drops just that product", () => {
    const list = withoutProduct([item(PRODUCT_A), item(PRODUCT_B)], PRODUCT_A);

    expect(list.map((i) => i.productId)).toEqual([PRODUCT_B]);
  });

  it("leaves the list alone when the product was never saved", () => {
    const list = withoutProduct([item(PRODUCT_A)], PRODUCT_B);

    expect(list.map((i) => i.productId)).toEqual([PRODUCT_A]);
  });
});
