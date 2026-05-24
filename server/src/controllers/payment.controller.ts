import { z } from "zod";
import { prisma } from "../config/prisma.client";
import {
  confirmReservationPayment,
} from "../services/parking.service";
import { asyncHandler } from "../utils/catchAsync";
import { createHttpError } from "../utils/AppError";
import { serializeReservation } from "../utils/serializers";

export const paymentConfirmSchema = z.object({
  reservationId: z.string().uuid(),
  paymentMethodId: z.string().uuid().optional(),
  providerPaymentId: z.string().trim().optional(),
  cardLast4: z.string().regex(/^\d{4}$/).optional(),
  vehiclePlate: z.string().trim().min(2).optional(),
  simulateFailure: z.boolean().optional().default(false),
});

export const paymentConfirmByParamSchema = paymentConfirmSchema.omit({
  reservationId: true,
});

export const paymentReservationParamsSchema = z.object({
  reservationId: z.string().uuid(),
});

export const confirmPayment = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "AUTH_TOKEN_REQUIRED", "Authorization Bearer token is required");
  }

  if (req.body.simulateFailure) {
    throw createHttpError(402, "PAYMENT_DECLINED", "Simulated payment was declined");
  }

  const result = await confirmReservationPayment(req.body.reservationId, req.user, {
    paymentMethodId: req.body.paymentMethodId,
    vehiclePlate: req.body.vehiclePlate,
  });
  res.json({
    ...result,
    payment: {
      providerPaymentId: req.body.providerPaymentId ?? null,
      cardLast4: req.body.cardLast4 ?? null,
      status: "CONFIRMED",
      confirmedAt: new Date().toISOString(),
    },
  });
});

export const confirmPaymentByParam = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "AUTH_TOKEN_REQUIRED", "Authorization Bearer token is required");
  }

  if (req.body?.simulateFailure) {
    throw createHttpError(402, "PAYMENT_DECLINED", "Simulated payment was declined");
  }

  const result = await confirmReservationPayment(req.params.reservationId, req.user, {
    paymentMethodId: req.body?.paymentMethodId,
    vehiclePlate: req.body?.vehiclePlate,
  });
  res.json({
    ...result,
    payment: {
      providerPaymentId: req.body?.providerPaymentId ?? null,
      cardLast4: req.body?.cardLast4 ?? null,
      status: "CONFIRMED",
      confirmedAt: new Date().toISOString(),
    },
  });
});

export const paymentHistory = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "AUTH_TOKEN_REQUIRED", "Authorization Bearer token is required");
  }

  const reservations = await prisma.reservation.findMany({
    where: {
      userId: req.user.id,
      status: {
        in: ["RESERVED", "COMPLETED", "CANCELLED", "EXPIRED"],
      },
    },
    include: {
      spot: true,
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          profile: true,
        },
      },
      vehicle: true,
      paymentMethod: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    payments: reservations.map((reservation) => ({
      id: reservation.id,
      status: reservation.status,
      amount: Number(reservation.totalPrice),
      currency: "UAH",
      paidAt: reservation.paidAt?.toISOString() ?? null,
      reservation: serializeReservation(reservation),
    })),
  });
});


