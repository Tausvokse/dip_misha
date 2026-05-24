import { z } from "zod";
import {
  calculateBillingQuote,
} from "../services/billing.service";
import {
  cancelReservation,
  createReservationLock,
  getReservationById,
  listUserReservations,
  extendReservation,
} from "../services/parking.service";
import { asyncHandler } from "../utils/catchAsync";
import { createHttpError } from "../utils/AppError";

const dateString = z
  .string()
  .datetime()
  .transform((value) => new Date(value));

const reservationTimeSchema = z.object({
  startTime: dateString.optional(),
  endTime: dateString.optional(),
  durationMinutes: z.number().int().positive().optional(),
  promoCode: z.string().trim().optional().nullable(),
});

export const quoteSchema = reservationTimeSchema
  .refine((value) => value.endTime || value.durationMinutes, {
    message: "endTime or durationMinutes is required",
  });

export const reservationLockSchema = reservationTimeSchema
  .extend({
    spotId: z.string().uuid().optional(),
    spotNumber: z.string().min(1).optional(),
    vehicleId: z.string().uuid().optional(),
  })
  .refine((value) => value.endTime || value.durationMinutes, {
    message: "endTime or durationMinutes is required",
  })
  .refine((value) => value.spotId || value.spotNumber, {
    message: "spotId or spotNumber is required",
  });

export const reservationIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const extendSchema = z.object({
  durationMinutes: z.number().int().positive(),
});

function resolveQuoteTimes(input: {
  startTime?: Date;
  endTime?: Date;
  durationMinutes?: number;
}) {
  const startTime = input.startTime ?? new Date();
  const endTime =
    input.endTime ??
    (input.durationMinutes
      ? new Date(startTime.getTime() + input.durationMinutes * 60_000)
      : undefined);

  if (!endTime) {
    throw createHttpError(
      400,
      "END_TIME_REQUIRED",
      "endTime or durationMinutes must be provided",
    );
  }

  return { startTime, endTime };
}

export const quoteReservation = asyncHandler(async (req, res) => {
  const { startTime, endTime } = resolveQuoteTimes(req.body);
  const quote = calculateBillingQuote({
    startTime,
    endTime,
    promoCode: req.body.promoCode,
  });

  res.json({ quote });
});

export const lockReservation = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "AUTH_TOKEN_REQUIRED", "Authorization Bearer token is required");
  }

  const result = await createReservationLock(req.user.id, req.body);
  res.status(201).json(result);
});

export const myReservations = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "AUTH_TOKEN_REQUIRED", "Authorization Bearer token is required");
  }

  const result = await listUserReservations(req.user.id);
  res.json(result);
});

export const getReservation = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "AUTH_TOKEN_REQUIRED", "Authorization Bearer token is required");
  }

  const result = await getReservationById(req.params.id, req.user);
  res.json(result);
});

export const cancel = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "AUTH_TOKEN_REQUIRED", "Authorization Bearer token is required");
  }

  const result = await cancelReservation(req.params.id, req.user);
  res.json(result);
});

export const extend = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "AUTH_TOKEN_REQUIRED", "Authorization Bearer token is required");
  }

  const { durationMinutes } = req.body;
  if (!durationMinutes) {
    throw createHttpError(400, "INVALID_INPUT", "durationMinutes is required");
  }

  const result = await extendReservation(req.user.id, req.params.id, durationMinutes);
  res.json(result);
});
