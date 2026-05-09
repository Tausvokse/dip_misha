import {
  ParkingSpotStatus,
  Prisma,
  ReservationStatus,
  Role,
} from "@prisma/client";
import { env } from "../config/env.config";
import { prisma } from "../config/prisma.client";
import { calculateBillingQuote } from "./billing.service";
import {
  emitParkingEvent,
  emitReservationEvent,
} from "../sockets";
import { createHttpError } from "../utils/AppError";
import {
  serializeReservation,
  serializeSpot,
  type ReservationWithRelations,
} from "../utils/serializers";

const lockTimers = new Map<string, NodeJS.Timeout>();

type Actor = {
  id: string;
  role: Role;
};

type CreateReservationLockInput = {
  spotId?: string;
  spotNumber?: string;
  vehicleId?: string;
  startTime?: Date;
  endTime?: Date;
  durationMinutes?: number;
  promoCode?: string | null;
};

const activeReservationStatuses = [
  ReservationStatus.PENDING_PAYMENT,
  ReservationStatus.RESERVED,
];

function reservationInclude() {
  return {
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
  };
}

function canAccessReservation(actor: Actor, reservationUserId: string) {
  return actor.role === Role.ADMIN || actor.id === reservationUserId;
}

function spotUnavailableError(status: ParkingSpotStatus) {
  if (status === ParkingSpotStatus.LOCKED) {
    return createHttpError(
      409,
      "SPOT_LOCKED",
      "Parking spot is currently locked for another payment",
    );
  }

  if (status === ParkingSpotStatus.RESERVED) {
    return createHttpError(409, "SPOT_RESERVED", "Parking spot is already reserved");
  }

  if (status === ParkingSpotStatus.MAINTENANCE) {
    return createHttpError(409, "SPOT_MAINTENANCE", "Parking spot is under maintenance");
  }

  return createHttpError(409, "SPOT_NOT_AVAILABLE", "Parking spot is not available");
}

async function findSpotOrThrow(input: { spotId?: string; spotNumber?: string }) {
  if (!input.spotId && !input.spotNumber) {
    throw createHttpError(
      400,
      "SPOT_REQUIRED",
      "Either spotId or spotNumber must be provided",
    );
  }

  const spot = await prisma.parkingSpot.findFirst({
    where: {
      OR: [
        input.spotId ? { id: input.spotId } : undefined,
        input.spotNumber ? { number: input.spotNumber } : undefined,
      ].filter(Boolean) as Array<{ id: string } | { number: string }>,
    },
  });

  if (!spot) {
    throw createHttpError(404, "SPOT_NOT_FOUND", "Parking spot was not found");
  }

  return spot;
}

function resolveReservationTime(input: CreateReservationLockInput) {
  const startTime = input.startTime ?? new Date();
  let endTime = input.endTime;

  if (!endTime && input.durationMinutes) {
    endTime = new Date(startTime.getTime() + input.durationMinutes * 60_000);
  }

  if (!endTime) {
    throw createHttpError(
      400,
      "END_TIME_REQUIRED",
      "endTime or durationMinutes must be provided",
    );
  }

  return { startTime, endTime };
}

function emitReservationState(
  event: string,
  reservation: ReservationWithRelations,
  extra?: Record<string, unknown>,
) {
  const serializedReservation = serializeReservation(reservation);
  const serializedSpot = reservation.spot
    ? serializeSpot(reservation.spot)
    : undefined;
  const payload = {
    reservation: serializedReservation,
    spot: serializedSpot,
    serverTime: new Date().toISOString(),
    ...extra,
  };

  emitParkingEvent(event, payload);
  emitReservationEvent(reservation.id, event, payload);

  if (serializedSpot) {
    emitParkingEvent("spotUpdated", {
      spot: {
        ...serializedSpot,
        licensePlate: reservation.vehicle?.licensePlate ?? null,
        activeReservationId: reservation.id,
        lockExpiresAt: reservation.lockExpiresAt?.toISOString() ?? null,
      },
      reservation: serializedReservation,
      reason: event,
      serverTime: new Date().toISOString(),
    });
  }

  emitParkingEvent("dashboardUpdated", {
    reason: event,
    serverTime: new Date().toISOString(),
  });
}

function scheduleReservationLock(reservationId: string, lockExpiresAt: Date) {
  const existingTimer = lockTimers.get(reservationId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const delay = Math.max(0, lockExpiresAt.getTime() - Date.now());
  const timeout = setTimeout(() => {
    expireReservationLock(reservationId, "LOCK_TIMER_EXPIRED").catch((error) => {
      console.error(error);
    });
  }, delay);

  lockTimers.set(reservationId, timeout);
}

function clearReservationLockTimer(reservationId: string) {
  const timer = lockTimers.get(reservationId);
  if (timer) {
    clearTimeout(timer);
    lockTimers.delete(reservationId);
  }
}

export async function releaseExpiredLocksForSpot(spotId: string) {
  const expiredReservations = await prisma.reservation.findMany({
    where: {
      spotId,
      status: ReservationStatus.PENDING_PAYMENT,
      lockExpiresAt: {
        lte: new Date(),
      },
    },
    select: {
      id: true,
    },
  });

  for (const reservation of expiredReservations) {
    await expireReservationLock(reservation.id, "LOCK_ALREADY_EXPIRED");
  }
}

export async function createReservationLock(
  userId: string,
  input: CreateReservationLockInput,
) {
  const spot = await findSpotOrThrow(input);
  await releaseExpiredLocksForSpot(spot.id);

  if (input.vehicleId) {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: input.vehicleId,
        userId,
      },
    });

    if (!vehicle) {
      throw createHttpError(
        404,
        "VEHICLE_NOT_FOUND",
        "Vehicle was not found for this user",
      );
    }
  }

  const { startTime, endTime } = resolveReservationTime(input);
  const quote = calculateBillingQuote({
    startTime,
    endTime,
    promoCode: input.promoCode,
  });
  const lockExpiresAt = new Date(
    Date.now() + env.RESERVATION_LOCK_MINUTES * 60 * 1000,
  );

  const reservation = await prisma.$transaction(async (tx) => {
    const currentSpot = await tx.parkingSpot.findUnique({
      where: { id: spot.id },
    });

    if (!currentSpot) {
      throw createHttpError(404, "SPOT_NOT_FOUND", "Parking spot was not found");
    }

    if (currentSpot.status !== ParkingSpotStatus.FREE) {
      throw spotUnavailableError(currentSpot.status);
    }

    const overlappingReservation = await tx.reservation.findFirst({
      where: {
        spotId: spot.id,
        status: {
          in: activeReservationStatuses,
        },
        startTime: {
          lt: endTime,
        },
        endTime: {
          gt: startTime,
        },
      },
    });

    if (overlappingReservation) {
      throw createHttpError(
        409,
        "SPOT_TIME_OVERLAP",
        "Parking spot already has an active reservation for this time range",
      );
    }

    const updatedSpot = await tx.parkingSpot.updateMany({
      where: {
        id: spot.id,
        status: ParkingSpotStatus.FREE,
      },
      data: {
        status: ParkingSpotStatus.LOCKED,
      },
    });

    if (updatedSpot.count !== 1) {
      throw createHttpError(
        409,
        "SPOT_NOT_AVAILABLE",
        "Parking spot was taken by another request",
      );
    }

    const createdReservation = await tx.reservation.create({
      data: {
        userId,
        spotId: spot.id,
        vehicleId: input.vehicleId,
        startTime,
        endTime,
        status: ReservationStatus.PENDING_PAYMENT,
        totalPrice: new Prisma.Decimal(quote.totalPrice),
        lockExpiresAt,
      },
    });

    return tx.reservation.findUniqueOrThrow({
      where: { id: createdReservation.id },
      include: reservationInclude(),
    });
  });

  scheduleReservationLock(reservation.id, lockExpiresAt);
  emitReservationState("reservationLocked", reservation, {
    lockExpiresAt: lockExpiresAt.toISOString(),
  });

  return {
    reservation: serializeReservation(reservation),
    quote,
  };
}

export async function confirmReservationPayment(
  reservationId: string,
  actor: Actor,
  input?: { paymentMethodId?: string | null },
) {
  const existingReservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });

  if (!existingReservation) {
    throw createHttpError(404, "RESERVATION_NOT_FOUND", "Reservation was not found");
  }

  if (!canAccessReservation(actor, existingReservation.userId)) {
    throw createHttpError(403, "FORBIDDEN", "You cannot pay this reservation");
  }

  if (existingReservation.status !== ReservationStatus.PENDING_PAYMENT) {
    throw createHttpError(
      409,
      "RESERVATION_NOT_PAYABLE",
      "Only pending payment reservations can be paid",
    );
  }

  if (
    existingReservation.lockExpiresAt &&
    existingReservation.lockExpiresAt <= new Date()
  ) {
    await expireReservationLock(reservationId, "PAYMENT_AFTER_LOCK_EXPIRATION");
    throw createHttpError(
      409,
      "LOCK_EXPIRED",
      "Payment window has expired. Please create a new reservation",
    );
  }

  if (input?.paymentMethodId) {
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: input.paymentMethodId,
        userId: actor.id,
      },
    });

    if (!paymentMethod) {
      throw createHttpError(
        404,
        "PAYMENT_METHOD_NOT_FOUND",
        "Payment method was not found for this user",
      );
    }
  }

  const reservation = await prisma.$transaction(async (tx) => {
    const freshReservation = await tx.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!freshReservation) {
      throw createHttpError(404, "RESERVATION_NOT_FOUND", "Reservation was not found");
    }

    if (freshReservation.status !== ReservationStatus.PENDING_PAYMENT) {
      throw createHttpError(
        409,
        "RESERVATION_NOT_PAYABLE",
        "Only pending payment reservations can be paid",
      );
    }

    await tx.parkingSpot.update({
      where: { id: freshReservation.spotId },
      data: { status: ParkingSpotStatus.RESERVED },
    });

    return tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: ReservationStatus.RESERVED,
        paidAt: new Date(),
        paymentMethodId: input?.paymentMethodId ?? freshReservation.paymentMethodId,
      },
      include: reservationInclude(),
    });
  });

  clearReservationLockTimer(reservationId);
  emitReservationState("paymentConfirmed", reservation);

  return {
    reservation: serializeReservation(reservation),
  };
}

export async function expireReservationLock(
  reservationId: string,
  reason = "LOCK_EXPIRED",
) {
  clearReservationLockTimer(reservationId);

  const reservation = await prisma.$transaction(async (tx) => {
    const existingReservation = await tx.reservation.findUnique({
      where: { id: reservationId },
      include: reservationInclude(),
    });

    if (!existingReservation) {
      return null;
    }

    if (existingReservation.status !== ReservationStatus.PENDING_PAYMENT) {
      return null;
    }

    await tx.parkingSpot.update({
      where: { id: existingReservation.spotId },
      data: { status: ParkingSpotStatus.FREE },
    });

    return tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: ReservationStatus.EXPIRED,
      },
      include: reservationInclude(),
    });
  });

  if (!reservation) {
    return null;
  }

  const payload = {
    reservation: serializeReservation(reservation),
    spot: reservation.spot ? serializeSpot(reservation.spot) : undefined,
    reason,
    serverTime: new Date().toISOString(),
  };

  emitParkingEvent("lockExpired", payload);
  emitParkingEvent("reservationExpired", payload);
  emitReservationEvent(reservation.id, "lockExpired", payload);
  emitReservationState("reservationUpdated", reservation, { reason });

  return {
    reservation: serializeReservation(reservation),
  };
}

export async function cancelReservation(reservationId: string, actor: Actor) {
  const existingReservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });

  if (!existingReservation) {
    throw createHttpError(404, "RESERVATION_NOT_FOUND", "Reservation was not found");
  }

  if (!canAccessReservation(actor, existingReservation.userId)) {
    throw createHttpError(403, "FORBIDDEN", "You cannot cancel this reservation");
  }

  if (
    existingReservation.status === ReservationStatus.CANCELLED ||
    existingReservation.status === ReservationStatus.EXPIRED ||
    existingReservation.status === ReservationStatus.COMPLETED
  ) {
    throw createHttpError(
      409,
      "RESERVATION_FINALIZED",
      "Reservation is already finalized",
    );
  }

  const reservation = await prisma.$transaction(async (tx) => {
    const updatedReservation = await tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: ReservationStatus.CANCELLED,
      },
      include: reservationInclude(),
    });

    await tx.parkingSpot.update({
      where: { id: updatedReservation.spotId },
      data: { status: ParkingSpotStatus.FREE },
    });

    return tx.reservation.findUniqueOrThrow({
      where: { id: reservationId },
      include: reservationInclude(),
    });
  });

  clearReservationLockTimer(reservationId);
  emitReservationState("reservationUpdated", reservation, {
    reason: "RESERVATION_CANCELLED",
  });

  return {
    reservation: serializeReservation(reservation),
  };
}

export async function getReservationById(reservationId: string, actor: Actor) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: reservationInclude(),
  });

  if (!reservation) {
    throw createHttpError(404, "RESERVATION_NOT_FOUND", "Reservation was not found");
  }

  if (!canAccessReservation(actor, reservation.userId)) {
    throw createHttpError(403, "FORBIDDEN", "You cannot view this reservation");
  }

  return {
    reservation: serializeReservation(reservation),
  };
}

export async function listUserReservations(userId: string) {
  const reservations = await prisma.reservation.findMany({
    where: { userId },
    include: reservationInclude(),
    orderBy: { createdAt: "desc" },
  });

  return {
    reservations: reservations.map(serializeReservation),
  };
}

export async function getActiveReservation(userId: string) {
  const reservation = await prisma.reservation.findFirst({
    where: {
      userId,
      status: {
        in: activeReservationStatuses,
      },
      endTime: {
        gt: new Date(),
      },
    },
    include: reservationInclude(),
    orderBy: { createdAt: "desc" },
  });

  return {
    reservation: reservation ? serializeReservation(reservation) : null,
  };
}

export async function restorePendingReservationTimers() {
  const pendingReservations = await prisma.reservation.findMany({
    where: {
      status: ReservationStatus.PENDING_PAYMENT,
      lockExpiresAt: {
        not: null,
      },
    },
  });

  for (const reservation of pendingReservations) {
    if (!reservation.lockExpiresAt) {
      continue;
    }

    if (reservation.lockExpiresAt <= new Date()) {
      await expireReservationLock(reservation.id, "LOCK_RESTORED_EXPIRED");
    } else {
      scheduleReservationLock(reservation.id, reservation.lockExpiresAt);
    }
  }
}

export async function completeFinishedReservations() {
  const finishedReservations = await prisma.reservation.findMany({
    where: {
      status: ReservationStatus.RESERVED,
      endTime: {
        lte: new Date(),
      },
    },
    include: reservationInclude(),
  });

  for (const item of finishedReservations) {
    const reservation = await prisma.$transaction(async (tx) => {
      await tx.parkingSpot.update({
        where: { id: item.spotId },
        data: { status: ParkingSpotStatus.FREE },
      });

      return tx.reservation.update({
        where: { id: item.id },
        data: { status: ReservationStatus.COMPLETED },
        include: reservationInclude(),
      });
    });

    emitReservationState("reservationCompleted", reservation);
  }
}


