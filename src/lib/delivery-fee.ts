import {
  DEFAULT_SITE_SETTINGS,
  deliveryFeeFor,
  freeDeliveryShortfall,
  type DeliveryFeeRule,
} from "@geekbase-labs/shared-types";
import { useQuery } from "@tanstack/react-query";

import { fetchSiteSettings } from "./site-settings-api";
import { SITE_SETTINGS_QUERY_KEY } from "./site-theme-context";

// Settings from an API that predates the fee have neither field; the shared
// defaults stand in, as they do for an unconfigured store.
export function feeRuleFromSettings(settings: Partial<DeliveryFeeRule> | undefined): DeliveryFeeRule {
  return {
    freeDeliveryThresholdInPaise:
      settings?.freeDeliveryThresholdInPaise ?? DEFAULT_SITE_SETTINGS.freeDeliveryThresholdInPaise,
    deliveryFeeInPaise: settings?.deliveryFeeInPaise ?? DEFAULT_SITE_SETTINGS.deliveryFeeInPaise,
  };
}

// The same query the theme provider runs, so this reads its cached answer.
export function useDeliveryFeeRule(): DeliveryFeeRule {
  const { data } = useQuery({
    queryKey: SITE_SETTINGS_QUERY_KEY,
    queryFn: fetchSiteSettings,
    staleTime: 5 * 60 * 1000,
  });
  return feeRuleFromSettings(data);
}

export function priceBag(payableInPaise: number, rule: DeliveryFeeRule) {
  const deliveryFeeInPaise = deliveryFeeFor(payableInPaise, rule);
  return {
    deliveryFeeInPaise,
    shortfallInPaise: freeDeliveryShortfall(payableInPaise, rule),
    totalInPaise: payableInPaise + deliveryFeeInPaise,
  };
}

function wholeRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function freeDeliveryRuleLabel(rule: DeliveryFeeRule): string {
  return rule.deliveryFeeInPaise === 0
    ? "Free delivery"
    : `Free delivery on orders over ${wholeRupees(rule.freeDeliveryThresholdInPaise)}`;
}

export function freeDeliveryShortLabel(rule: DeliveryFeeRule): string {
  return rule.deliveryFeeInPaise === 0
    ? "Free delivery"
    : `Free delivery over ${wholeRupees(rule.freeDeliveryThresholdInPaise)}`;
}
