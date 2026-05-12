import { PaymentMethodType, CardBrand } from "../types/enums";

import { z } from "zod";
import { prisma } from "../config/prisma.client";
import { getActiveReservation, listUserReservations } from "../services/parking.service";
import { asyncHandler } from "../utils/catchAsync";
import { createHttpError } from "../utils/AppError";
import {
  serializePaymentMethod,
  serializeReservation,
  serializeUser,
  serializeUserProfile,
  serializeVehicle } from "../utils/serializers";

export const updateProfileSchema = z.object({
  firstName: z.string().trim().max(80).optional().nullable(),
  lastName: z.string().trim().max(80).optional().nullable(),
  middleName: z.string().trim().max(80).optional().nullable(),
  phone: z.string().trim().max(32).optional().nullable() });

export const vehicleSchema = z.object({
  make: z.string().trim().min(1).max(80),
  model: z.string().trim().max(80).optional().nullable(),
  licensePlate: z.string().trim().min(2).max(20),
  color: z.string().trim().max(40).optional().nullable(),
  isDefault: z.boolean().optional().default(false) });

export const vehicleParamsSchema = z.object({
  vehicleId: z.string().uuid() });

export const paymentMethodSchema = z
  .object({
    type: z.nativeEnum(PaymentMethodType),
    label: z.string().trim().min(1).max(120),
    brand: z.nativeEnum(CardBrand).optional().nullable(),
    last4: z.string().regex(/^\d{4}$/).optional().nullable(),
    isDefault: z.boolean().optional().default(false) })
  .refine((value) => value.type !== PaymentMethodType.CARD || (value.brand && value.last4), {
    message: "Card payment method requires brand and last4" });

export const paymentMethodParamsSchema = z.object({
  paymentMethodId: z.string().uuid() });

function requireUserId(user?: Express.UserPayload) {
  if (!user) {
    throw createHttpError(401, "AUTH_TOKEN_REQUIRED", "Authorization Bearer token is required");
  }

  return user.id;
}

async function setDefaultVehicleIfRequested(userId: string, vehicleId: string, isDefault: boolean) {
  if (!isDefault) {
    return;
  }

  await prisma.vehicle.updateMany({
    where: {
      userId,
      id: {
        not: vehicleId } },
    data: { isDefault: false } });
}

async function setDefaultPaymentMethodIfRequested(
  userId: string,
  paymentMethodId: string,
  isDefault: boolean,
) {
  if (!isDefault) {
    return;
  }

  await prisma.paymentMethod.updateMany({
    where: {
      userId,
      id: {
        not: paymentMethodId } },
    data: { isDefault: false } });
}

export const profile = asyncHandler(async (req, res) => {
  const userId = requireUserId(req.user);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      profile: true,
      vehicles: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
      paymentMethods: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] } } });

  res.json({
    user: serializeUser(user),
    profile: serializeUserProfile(user.profile),
    vehicles: user.vehicles.map(serializeVehicle),
    paymentMethods: user.paymentMethods.map(serializePaymentMethod) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = requireUserId(req.user);

  const profileRecord = await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      firstName: req.body.firstName ?? null,
      lastName: req.body.lastName ?? null,
      middleName: req.body.middleName ?? null,
      phone: req.body.phone ?? null },
    update: {
      firstName: req.body.firstName ?? null,
      lastName: req.body.lastName ?? null,
      middleName: req.body.middleName ?? null,
      phone: req.body.phone ?? null } });

  res.json({
    profile: serializeUserProfile(profileRecord) });
});

export const listVehicles = asyncHandler(async (req, res) => {
  const userId = requireUserId(req.user);
  const vehicles = await prisma.vehicle.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });

  res.json({ vehicles: vehicles.map(serializeVehicle) });
});

export const createVehicle = asyncHandler(async (req, res) => {
  const userId = requireUserId(req.user);

  const vehicle = await prisma.vehicle.create({
    data: {
      userId,
      make: req.body.make,
      model: req.body.model ?? null,
      licensePlate: req.body.licensePlate.toUpperCase(),
      color: req.body.color ?? null,
      isDefault: req.body.isDefault } });

  await setDefaultVehicleIfRequested(userId, vehicle.id, vehicle.isDefault);

  res.status(201).json({ vehicle: serializeVehicle(vehicle) });
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const userId = requireUserId(req.user);

  const vehicle = await prisma.vehicle.update({
    where: {
      id: req.params.vehicleId,
      userId },
    data: {
      make: req.body.make,
      model: req.body.model ?? null,
      licensePlate: req.body.licensePlate.toUpperCase(),
      color: req.body.color ?? null,
      isDefault: req.body.isDefault } });

  await setDefaultVehicleIfRequested(userId, vehicle.id, vehicle.isDefault);

  res.json({ vehicle: serializeVehicle(vehicle) });
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const userId = requireUserId(req.user);

  const activeReservation = await prisma.reservation.findFirst({
    where: {
      userId,
      vehicleId: req.params.vehicleId,
      status: {
        in: ["PENDING_PAYMENT", "RESERVED"] },
      endTime: {
        gt: new Date() } } });

  if (activeReservation) {
    throw createHttpError(
      409,
      "VEHICLE_HAS_ACTIVE_RESERVATION",
      "Vehicle is used in an active reservation",
    );
  }

  await prisma.vehicle.delete({
    where: {
      id: req.params.vehicleId,
      userId } });

  res.status(204).send();
});

export const listPaymentMethods = asyncHandler(async (req, res) => {
  const userId = requireUserId(req.user);
  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });

  res.json({ paymentMethods: paymentMethods.map(serializePaymentMethod) });
});

export const createPaymentMethod = asyncHandler(async (req, res) => {
  const userId = requireUserId(req.user);

  const paymentMethod = await prisma.paymentMethod.create({
    data: {
      userId,
      type: req.body.type,
      label: req.body.label,
      brand: req.body.brand ?? null,
      last4: req.body.last4 ?? null,
      isDefault: req.body.isDefault } });

  await setDefaultPaymentMethodIfRequested(
    userId,
    paymentMethod.id,
    paymentMethod.isDefault,
  );

  res.status(201).json({ paymentMethod: serializePaymentMethod(paymentMethod) });
});

export const updatePaymentMethod = asyncHandler(async (req, res) => {
  const userId = requireUserId(req.user);

  const paymentMethod = await prisma.paymentMethod.update({
    where: {
      id: req.params.paymentMethodId,
      userId },
    data: {
      type: req.body.type,
      label: req.body.label,
      brand: req.body.brand ?? null,
      last4: req.body.last4 ?? null,
      isDefault: req.body.isDefault } });

  await setDefaultPaymentMethodIfRequested(
    userId,
    paymentMethod.id,
    paymentMethod.isDefault,
  );

  res.json({ paymentMethod: serializePaymentMethod(paymentMethod) });
});

export const deletePaymentMethod = asyncHandler(async (req, res) => {
  const userId = requireUserId(req.user);

  await prisma.paymentMethod.delete({
    where: {
      id: req.params.paymentMethodId,
      userId } });

  res.status(204).send();
});

export const activeReservation = asyncHandler(async (req, res) => {
  const userId = requireUserId(req.user);
  const result = await getActiveReservation(userId);
  res.json(result);
});

export const reservations = asyncHandler(async (req, res) => {
  const userId = requireUserId(req.user);
  const result = await listUserReservations(userId);
  res.json(result);
});

export const payments = asyncHandler(async (req, res) => {
  const userId = requireUserId(req.user);

  const reservationsList = await prisma.reservation.findMany({
    where: {
      userId,
      paidAt: {
        not: null } },
    include: {
      spot: true,
      vehicle: true,
      paymentMethod: true,
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          profile: true } } },
    orderBy: { paidAt: "desc" } });

  res.json({
    payments: reservationsList.map((reservation) => ({
      id: reservation.id,
      amount: Number(reservation.totalPrice),
      currency: "UAH",
      status: reservation.status,
      paidAt: reservation.paidAt?.toISOString() ?? null,
      reservation: serializeReservation(reservation),
      paymentMethod: reservation.paymentMethod
        ? serializePaymentMethod(reservation.paymentMethod)
        : null })) });
});
