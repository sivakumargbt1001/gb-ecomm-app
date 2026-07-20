import * as cartApi from "../cart-api";
import { useCart } from "../use-cart";

jest.mock("../cart-api");

const mockGetCart = cartApi.getCart as jest.MockedFunction<typeof cartApi.getCart>;
const mockAddCartItem = cartApi.addCartItem as jest.MockedFunction<typeof cartApi.addCartItem>;
const mockUpdateCartItem = cartApi.updateCartItem as jest.MockedFunction<typeof cartApi.updateCartItem>;
const mockRemoveCartItem = cartApi.removeCartItem as jest.MockedFunction<typeof cartApi.removeCartItem>;

describe("use-cart module exports", () => {
  it("exports useCart as a function", () => {
    expect(typeof useCart).toBe("function");
  });

  it("cart-api functions are mockable", () => {
    expect(mockGetCart).toBeDefined();
    expect(mockAddCartItem).toBeDefined();
    expect(mockUpdateCartItem).toBeDefined();
    expect(mockRemoveCartItem).toBeDefined();
  });
});
