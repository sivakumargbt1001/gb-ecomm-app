import {
  POINT_VALUE_IN_PAISE,
  maxRedeemablePoints,
  pointsToPaise,
} from "@geekbase-labs/shared-types";

export type OrderPointsContext = {
  balance: number;
  maxRedemptionPercent: number;
  subtotalInPaise: number;
  // What is still owed once any coupon has come off — points cannot pay more
  // than that.
  payableInPaise: number;
};

// The most points this order will take. Pure, like the coupon and review
// helpers, because this repo has no React renderer to test the decision inside
// a component.
export function usablePoints(input: OrderPointsContext): number {
  const capped = maxRedeemablePoints({
    subtotalInPaise: input.subtotalInPaise,
    maxRedemptionPercent: input.maxRedemptionPercent,
    balance: input.balance,
  });
  return Math.max(
    0,
    Math.min(
      capped,
      Math.floor(Math.max(0, input.payableInPaise) / POINT_VALUE_IN_PAISE),
    ),
  );
}

export function redeemedValueInPaise(points: number): number {
  return pointsToPaise(points);
}

export type RedeemValidation =
  | { ok: true; points: number }
  | { ok: false; error: string };

export function validateRedeemDraft(raw: string, max: number): RedeemValidation {
  if (!raw.trim()) return { ok: false, error: "Enter how many points to use" };

  const points = Number(raw);
  if (!Number.isInteger(points)) {
    return { ok: false, error: "Points come in whole numbers" };
  }
  if (points <= 0) {
    return { ok: false, error: "Enter a number of points above zero" };
  }
  if (points > max) {
    return { ok: false, error: `You can use at most ${max} points on this order` };
  }
  return { ok: true, points };
}

// The number checkout may actually send. Points applied against a bigger cart
// are withheld rather than submitted, so the shopper is never charged on
// numbers they were not shown.
export function checkoutRedeemPoints(
  input: OrderPointsContext & { points: number },
): number | undefined {
  if (input.points <= 0) return undefined;
  return input.points > usablePoints(input) ? undefined : input.points;
}
