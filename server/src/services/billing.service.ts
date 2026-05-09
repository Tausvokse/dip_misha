import { env } from "../config/env.config";
import { createHttpError } from "../utils/AppError";

export type BillingQuoteInput = {
  startTime: Date;
  endTime: Date;
  promoCode?: string | null;
};

export type BillingSegment = {
  from: string;
  to: string;
  minutes: number;
  hourlyRate: number;
  amount: number;
};

export type BillingQuote = {
  currency: "UAH";
  startTime: string;
  endTime: string;
  durationMinutes: number;
  subtotal: number;
  discount: number;
  totalPrice: number;
  appliedPromoCode: string | null;
  segments: BillingSegment[];
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isNightHour(hour: number) {
  if (env.NIGHT_START_HOUR === env.NIGHT_END_HOUR) {
    return false;
  }

  if (env.NIGHT_START_HOUR > env.NIGHT_END_HOUR) {
    return hour >= env.NIGHT_START_HOUR || hour < env.NIGHT_END_HOUR;
  }

  return hour >= env.NIGHT_START_HOUR && hour < env.NIGHT_END_HOUR;
}

function hourlyRateFor(date: Date) {
  return isNightHour(date.getHours()) ? env.NIGHT_RATE_UAH : env.DAY_RATE_UAH;
}

function nextHourBoundary(date: Date) {
  const next = new Date(date);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next;
}

function promoDiscount(subtotal: number, promoCode?: string | null) {
  const normalized = promoCode?.trim().toUpperCase();

  if (!normalized) {
    return { discount: 0, appliedPromoCode: null };
  }

  if (normalized === "PROMO10") {
    return {
      discount: roundMoney(subtotal * 0.1),
      appliedPromoCode: normalized,
    };
  }

  if (normalized === "NIGHTOWL") {
    return {
      discount: roundMoney(subtotal * 0.15),
      appliedPromoCode: normalized,
    };
  }

  throw createHttpError(400, "INVALID_PROMO_CODE", "Promo code is not valid");
}

export function calculateBillingQuote(input: BillingQuoteInput): BillingQuote {
  const { startTime, endTime, promoCode } = input;

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw createHttpError(400, "INVALID_DATE", "startTime and endTime must be valid dates");
  }

  if (endTime <= startTime) {
    throw createHttpError(400, "INVALID_RESERVATION_TIME", "endTime must be later than startTime");
  }

  const durationMinutes = Math.ceil(
    (endTime.getTime() - startTime.getTime()) / 60_000,
  );

  if (durationMinutes < 15) {
    throw createHttpError(
      400,
      "RESERVATION_TOO_SHORT",
      "Reservation duration must be at least 15 minutes",
    );
  }

  if (durationMinutes > 24 * 60) {
    throw createHttpError(
      400,
      "RESERVATION_TOO_LONG",
      "Reservation duration cannot exceed 24 hours",
    );
  }

  const segments: BillingSegment[] = [];
  let cursor = new Date(startTime);
  let subtotal = 0;

  while (cursor < endTime) {
    const rate = hourlyRateFor(cursor);
    const boundary = nextHourBoundary(cursor);
    const segmentEnd = boundary < endTime ? boundary : endTime;
    const minutes = Math.ceil((segmentEnd.getTime() - cursor.getTime()) / 60_000);
    const amount = roundMoney((minutes / 60) * rate);

    segments.push({
      from: cursor.toISOString(),
      to: segmentEnd.toISOString(),
      minutes,
      hourlyRate: rate,
      amount,
    });

    subtotal += amount;
    cursor = segmentEnd;
  }

  subtotal = roundMoney(subtotal);
  const promo = promoDiscount(subtotal, promoCode);
  const totalPrice = roundMoney(Math.max(0, subtotal - promo.discount));

  return {
    currency: "UAH",
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    durationMinutes,
    subtotal,
    discount: promo.discount,
    totalPrice,
    appliedPromoCode: promo.appliedPromoCode,
    segments,
  };
}


