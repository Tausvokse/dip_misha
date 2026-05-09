import type {
  PaymentMethod,
  ParkingSpot,
  Reservation,
  User,
  UserProfile,
  Vehicle,
} from "@prisma/client";

export type PublicUser = Pick<User, "id" | "email" | "role"> & {
  profile?: UserProfile | null;
};

export type ReservationWithRelations = Reservation & {
  spot?: ParkingSpot | null;
  user?: PublicUser | null;
  vehicle?: Vehicle | null;
  paymentMethod?: PaymentMethod | null;
};

export function serializeUserProfile(profile: UserProfile | null | undefined) {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    userId: profile.userId,
    firstName: profile.firstName,
    lastName: profile.lastName,
    middleName: profile.middleName,
    phone: profile.phone,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export function serializeUser(user: PublicUser) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    profile: serializeUserProfile(user.profile),
  };
}

export function serializeSpot(spot: ParkingSpot) {
  return {
    id: spot.id,
    number: spot.number,
    status: spot.status,
    createdAt: spot.createdAt.toISOString(),
    updatedAt: spot.updatedAt.toISOString(),
  };
}

export function serializeVehicle(vehicle: Vehicle) {
  return {
    id: vehicle.id,
    userId: vehicle.userId,
    make: vehicle.make,
    model: vehicle.model,
    licensePlate: vehicle.licensePlate,
    color: vehicle.color,
    isDefault: vehicle.isDefault,
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString(),
  };
}

export function serializePaymentMethod(paymentMethod: PaymentMethod) {
  return {
    id: paymentMethod.id,
    userId: paymentMethod.userId,
    type: paymentMethod.type,
    label: paymentMethod.label,
    brand: paymentMethod.brand,
    last4: paymentMethod.last4,
    isDefault: paymentMethod.isDefault,
    createdAt: paymentMethod.createdAt.toISOString(),
    updatedAt: paymentMethod.updatedAt.toISOString(),
  };
}

export function serializeReservation(reservation: ReservationWithRelations) {
  return {
    id: reservation.id,
    userId: reservation.userId,
    spotId: reservation.spotId,
    vehicleId: reservation.vehicleId,
    paymentMethodId: reservation.paymentMethodId,
    startTime: reservation.startTime.toISOString(),
    endTime: reservation.endTime.toISOString(),
    status: reservation.status,
    totalPrice: Number(reservation.totalPrice),
    lockExpiresAt: reservation.lockExpiresAt
      ? reservation.lockExpiresAt.toISOString()
      : null,
    paidAt: reservation.paidAt ? reservation.paidAt.toISOString() : null,
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
    spot: reservation.spot ? serializeSpot(reservation.spot) : undefined,
    user: reservation.user ? serializeUser(reservation.user) : undefined,
    vehicle: reservation.vehicle ? serializeVehicle(reservation.vehicle) : undefined,
    paymentMethod: reservation.paymentMethod
      ? serializePaymentMethod(reservation.paymentMethod)
      : undefined,
  };
}
