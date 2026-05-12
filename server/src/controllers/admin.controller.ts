import { ParkingSpotStatus, ReservationStatus } from "../types/enums";
﻿
import { z } from "zod";
import { prisma } from "../config/prisma.client";
import { asyncHandler } from "../utils/catchAsync";
import { serializeReservation, serializeSpot } from "../utils/serializers";

export const adminReservationsQuerySchema = z.object({
  status: z.nativeEnum(ReservationStatus).optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(50) });

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function revenueBetween(from: Date, to: Date) {
  const aggregate = await prisma.reservation.aggregate({
    where: {
      status: {
        in: [ReservationStatus.RESERVED, ReservationStatus.COMPLETED] },
      paidAt: {
        gte: from,
        lt: to } },
    _sum: {
      totalPrice: true } });

  return Number(aggregate._sum.totalPrice ?? 0);
}

export const stats = asyncHandler(async (_req, res) => {
  const [spots, reservationsByStatus, totalReservations] = await Promise.all([
    prisma.parkingSpot.groupBy({
      by: ["status"],
      _count: {
        _all: true } }),
    prisma.reservation.groupBy({
      by: ["status"],
      _count: {
        _all: true } }),
    prisma.reservation.count(),
  ]);

  const spotCounts: Record<string, number> = {
    total: 0,
    FREE: 0,
    LOCKED: 0,
    RESERVED: 0,
    MAINTENANCE: 0 };

  for (const item of spots) {
    spotCounts[item.status] = item._count._all;
    spotCounts.total += item._count._all;
  }

  const reservationCounts: Record<string, number> = {
    total: totalReservations,
    PENDING_PAYMENT: 0,
    RESERVED: 0,
    CANCELLED: 0,
    EXPIRED: 0,
    COMPLETED: 0 };

  for (const item of reservationsByStatus) {
    reservationCounts[item.status] = item._count._all;
  }

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const sevenDaysAgo = addDays(today, -6);
  const thirtyDaysAgo = addDays(today, -29);

  const [todayRevenue, weekRevenue, monthRevenue, recentReservations] =
    await Promise.all([
      revenueBetween(today, tomorrow),
      revenueBetween(sevenDaysAgo, tomorrow),
      revenueBetween(thirtyDaysAgo, tomorrow),
      prisma.reservation.findMany({
        take: 10,
        include: {
          spot: true,
          user: {
            select: {
              id: true,
              email: true,
              role: true } } },
        orderBy: { createdAt: "desc" } }),
    ]);

  const chart = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const from = addDays(today, -offset);
    const to = addDays(from, 1);
    const [revenue, reservationsCount] = await Promise.all([
      revenueBetween(from, to),
      prisma.reservation.count({
        where: {
          createdAt: {
            gte: from,
            lt: to } } }),
    ]);

    chart.push({
      date: from.toISOString().slice(0, 10),
      revenue,
      reservations: reservationsCount });
  }

  res.json({
    spots: spotCounts,
    reservations: reservationCounts,
    occupancyRate:
      spotCounts.total === 0
        ? 0
        : Math.round(((spotCounts.RESERVED + spotCounts.LOCKED) / spotCounts.total) * 10000) /
          100,
    revenue: {
      currency: "UAH",
      today: todayRevenue,
      last7Days: weekRevenue,
      last30Days: monthRevenue },
    chart,
    recentReservations: recentReservations.map(serializeReservation) });
});

export const reservations = asyncHandler(async (req, res) => {
  const reservationsList = await prisma.reservation.findMany({
    where: req.query.status
      ? {
          status: req.query.status as ReservationStatus }
      : undefined,
    take: Number(req.query.limit ?? 50),
    include: {
      spot: true,
      user: {
        select: {
          id: true,
          email: true,
          role: true } } },
    orderBy: { createdAt: "desc" } });

  res.json({
    reservations: reservationsList.map(serializeReservation) });
});

export const spots = asyncHandler(async (_req, res) => {
  const spotsList = await prisma.parkingSpot.findMany({
    orderBy: { number: "asc" } });

  res.json({
    spots: spotsList.map(serializeSpot),
    statuses: Object.values(ParkingSpotStatus) });
});


