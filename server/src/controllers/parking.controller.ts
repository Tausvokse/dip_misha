import { ParkingSpotStatus, Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma.client";
import { emitParkingEvent } from "../sockets";
import { asyncHandler } from "../utils/catchAsync";
import { createHttpError } from "../utils/AppError";
import { serializeSpot } from "../utils/serializers";

export const idOrNumberParamsSchema = z.object({
  idOrNumber: z.string().min(1),
});

export const listSpotsQuerySchema = z.object({
  status: z
    .union([
      z.nativeEnum(ParkingSpotStatus),
      z.array(z.nativeEnum(ParkingSpotStatus)),
    ])
    .optional(),
});

export const updateSpotStatusSchema = z.object({
  status: z.nativeEnum(ParkingSpotStatus),
  force: z.boolean().optional().default(false),
});

export const maintenanceSchema = z.object({
  enabled: z.boolean(),
  force: z.boolean().optional().default(false),
});

async function findSpotByIdOrNumber(idOrNumber: string) {
  const spot = await prisma.parkingSpot.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { number: idOrNumber }],
    },
  });

  if (!spot) {
    throw createHttpError(404, "SPOT_NOT_FOUND", "Parking spot was not found");
  }

  return spot;
}

async function ensureSpotCanChangeStatus(
  spotId: string,
  nextStatus: ParkingSpotStatus,
  force: boolean,
) {
  if (force || nextStatus === ParkingSpotStatus.RESERVED) {
    return;
  }

  const activeReservation = await prisma.reservation.findFirst({
    where: {
      spotId,
      status: {
        in: ["PENDING_PAYMENT", "RESERVED"],
      },
      endTime: {
        gt: new Date(),
      },
    },
  });

  if (activeReservation) {
    throw createHttpError(
      409,
      "SPOT_HAS_ACTIVE_RESERVATION",
      "Parking spot has an active reservation. Use force=true to override",
    );
  }
}

export const listSpots = asyncHandler(async (req, res) => {
  const rawStatus = req.query.status;
  const statuses = Array.isArray(rawStatus)
    ? rawStatus
    : typeof rawStatus === "string"
      ? rawStatus.split(",").filter(Boolean)
      : undefined;

  const spots = await prisma.parkingSpot.findMany({
    where: statuses?.length
      ? {
          status: {
            in: statuses as ParkingSpotStatus[],
          },
        }
      : undefined,
    include: {
      reservations: {
        where: {
          status: {
            in: ["PENDING_PAYMENT", "RESERVED"],
          },
          endTime: {
            gt: new Date(),
          },
        },
        include: {
          vehicle: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: {
      number: "asc",
    },
  });

  res.json({
    spots: spots.map((spot) => {
      const activeReservation = spot.reservations[0];
      return {
        ...serializeSpot(spot),
        activeReservationId: activeReservation?.id ?? null,
        licensePlate: activeReservation?.vehicle?.licensePlate ?? null,
        lockExpiresAt: activeReservation?.lockExpiresAt?.toISOString() ?? null,
      };
    }),
    total: spots.length,
  });
});

export const getSpot = asyncHandler(async (req, res) => {
  const spot = await findSpotByIdOrNumber(req.params.idOrNumber);
  res.json({
    spot: serializeSpot(spot),
  });
});

export const updateSpotStatus = asyncHandler(async (req, res) => {
  if (req.user?.role !== Role.ADMIN) {
    throw createHttpError(403, "FORBIDDEN", "Admin role is required");
  }

  const spot = await findSpotByIdOrNumber(req.params.idOrNumber);
  await ensureSpotCanChangeStatus(spot.id, req.body.status, req.body.force);

  const updatedSpot = await prisma.parkingSpot.update({
    where: { id: spot.id },
    data: { status: req.body.status },
  });

  const payload = {
    spot: serializeSpot(updatedSpot),
    reason: "ADMIN_STATUS_CHANGED",
    serverTime: new Date().toISOString(),
  };
  emitParkingEvent("spotUpdated", payload);
  emitParkingEvent("dashboardUpdated", payload);

  res.json({
    spot: serializeSpot(updatedSpot),
  });
});

export const setMaintenance = asyncHandler(async (req, res) => {
  if (req.user?.role !== Role.ADMIN) {
    throw createHttpError(403, "FORBIDDEN", "Admin role is required");
  }

  const spot = await findSpotByIdOrNumber(req.params.idOrNumber);
  const nextStatus = req.body.enabled
    ? ParkingSpotStatus.MAINTENANCE
    : ParkingSpotStatus.FREE;

  await ensureSpotCanChangeStatus(spot.id, nextStatus, req.body.force);

  const updatedSpot = await prisma.parkingSpot.update({
    where: { id: spot.id },
    data: { status: nextStatus },
  });

  const payload = {
    spot: serializeSpot(updatedSpot),
    reason: req.body.enabled ? "MAINTENANCE_ENABLED" : "MAINTENANCE_DISABLED",
    serverTime: new Date().toISOString(),
  };
  emitParkingEvent("spotUpdated", payload);
  emitParkingEvent("dashboardUpdated", payload);

  res.json({
    spot: serializeSpot(updatedSpot),
  });
});


