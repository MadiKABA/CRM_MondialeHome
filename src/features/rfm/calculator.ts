import {
  FREQUENCY_THRESHOLDS,
  MONETARY_THRESHOLDS,
  RECENCY_THRESHOLDS,
  type RFMProfile,
  type RFMResult,
} from "./types";

export function calcRecencyScore(lastPurchaseAt: Date | null): {
  score: number;
  daysSince: number | null;
} {
  if (!lastPurchaseAt) return { score: 1, daysSince: null };

  const diffMs = Date.now() - lastPurchaseAt.getTime();
  const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let score = 1;
  if (daysSince <= RECENCY_THRESHOLDS[5]) score = 5;
  else if (daysSince <= RECENCY_THRESHOLDS[4]) score = 4;
  else if (daysSince <= RECENCY_THRESHOLDS[3]) score = 3;
  else if (daysSince <= RECENCY_THRESHOLDS[2]) score = 2;

  return { score, daysSince };
}

export function calcFrequencyScore(ordersLast12Months: number): number {
  if (ordersLast12Months >= FREQUENCY_THRESHOLDS[5]) return 5;
  if (ordersLast12Months >= FREQUENCY_THRESHOLDS[4]) return 4;
  if (ordersLast12Months >= FREQUENCY_THRESHOLDS[3]) return 3;
  if (ordersLast12Months >= FREQUENCY_THRESHOLDS[2]) return 2;
  return 1;
}

export function calcMonetaryScore(revenueLast12Months: number): number {
  if (revenueLast12Months >= MONETARY_THRESHOLDS[5]) return 5;
  if (revenueLast12Months >= MONETARY_THRESHOLDS[4]) return 4;
  if (revenueLast12Months >= MONETARY_THRESHOLDS[3]) return 3;
  if (revenueLast12Months >= MONETARY_THRESHOLDS[2]) return 2;
  return 1;
}

export function determineProfile(
  r: number,
  f: number,
  m: number,
  hasAnyPurchase: boolean
): RFMProfile {
  if (!hasAnyPurchase) return "others";
  if (r >= 4 && f >= 4 && m >= 4) return "champions";
  if (r >= 3 && f >= 3 && m >= 3) return "loyal";
  if (r >= 4 && f === 1) return "new_customers";
  if (r >= 3 && m >= 2) return "potential";
  if (r <= 2 && (f >= 3 || m >= 3)) return "at_risk";
  if (r <= 2) return "lost";
  return "others";
}

export function calculateRFM(params: {
  clientId: string;
  lastPurchaseAt: Date | null;
  ordersLast12Months: number;
  revenueLast12Months: number;
}): RFMResult {
  const { score: r, daysSince } = calcRecencyScore(params.lastPurchaseAt);
  const f = calcFrequencyScore(params.ordersLast12Months);
  const m = calcMonetaryScore(params.revenueLast12Months);
  const profile = determineProfile(r, f, m, params.ordersLast12Months > 0);

  return {
    clientId: params.clientId,
    r,
    f,
    m,
    profile,
    daysSinceLastPurchase: daysSince,
    ordersLast12Months: params.ordersLast12Months,
    revenueLast12Months: params.revenueLast12Months,
  };
}
