import { DEFAULT_SITE_SETTINGS } from "@geekbase-labs/shared-types";

import {
  feeRuleFromSettings,
  freeDeliveryRuleLabel,
  freeDeliveryShortLabel,
  priceBag,
} from "../delivery-fee";

const RULE = { freeDeliveryThresholdInPaise: 69900, deliveryFeeInPaise: 4000 };

describe("feeRuleFromSettings", () => {
  it("takes the store's threshold and fee", () => {
    expect(
      feeRuleFromSettings({ freeDeliveryThresholdInPaise: 99900, deliveryFeeInPaise: 5000 }),
    ).toEqual({ freeDeliveryThresholdInPaise: 99900, deliveryFeeInPaise: 5000 });
  });

  it("falls back to the shared defaults before settings load, or from an older API", () => {
    expect(feeRuleFromSettings(undefined)).toEqual({
      freeDeliveryThresholdInPaise: DEFAULT_SITE_SETTINGS.freeDeliveryThresholdInPaise,
      deliveryFeeInPaise: DEFAULT_SITE_SETTINGS.deliveryFeeInPaise,
    });
    expect(feeRuleFromSettings({})).toEqual(feeRuleFromSettings(undefined));
  });
});

describe("priceBag", () => {
  it("adds the fee below the threshold and says how far free delivery is", () => {
    expect(priceBag(50000, RULE)).toEqual({
      deliveryFeeInPaise: 4000,
      shortfallInPaise: 19900,
      totalInPaise: 54000,
    });
  });

  it("delivers free from the threshold", () => {
    expect(priceBag(69900, RULE)).toEqual({
      deliveryFeeInPaise: 0,
      shortfallInPaise: 0,
      totalInPaise: 69900,
    });
  });
});

describe("rule wording", () => {
  it("names the threshold in whole rupees", () => {
    expect(freeDeliveryRuleLabel(RULE)).toBe("Free delivery on orders over ₹699");
    expect(freeDeliveryShortLabel(RULE)).toBe("Free delivery over ₹699");
  });

  it("just says free when there is no fee", () => {
    expect(freeDeliveryRuleLabel({ ...RULE, deliveryFeeInPaise: 0 })).toBe("Free delivery");
    expect(freeDeliveryShortLabel({ ...RULE, deliveryFeeInPaise: 0 })).toBe("Free delivery");
  });
});
