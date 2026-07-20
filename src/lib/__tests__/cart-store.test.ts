import { useCartUiStore } from "../cart-store";

describe("cart-store", () => {
  afterEach(() => {
    useCartUiStore.setState({ isCheckoutLoading: false });
  });

  it("defaults to isCheckoutLoading false", () => {
    expect(useCartUiStore.getState().isCheckoutLoading).toBe(false);
  });

  it("setCheckoutLoading toggles the loading state", () => {
    useCartUiStore.getState().setCheckoutLoading(true);
    expect(useCartUiStore.getState().isCheckoutLoading).toBe(true);

    useCartUiStore.getState().setCheckoutLoading(false);
    expect(useCartUiStore.getState().isCheckoutLoading).toBe(false);
  });
});
