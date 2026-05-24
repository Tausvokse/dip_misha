import type { User } from "./user.types";

export type SpotStatus = "FREE" | "LOCKED" | "RESERVED" | "MAINTENANCE";
export type ReservationStatus =
  | "PENDING_PAYMENT"
  | "RESERVED"
  | "CANCELLED"
  | "EXPIRED"
  | "COMPLETED";

export interface ParkingSpot {
  id: string;
  number: string;
  status: SpotStatus;
  createdAt?: string;
  updatedAt?: string;
  activeReservationId?: string | null;
  lockExpiresAt?: string | null;
  freeAt?: string | null;
  licensePlate?: string | null;
}

export interface Reservation {
  id: string;
  userId: string;
  spotId: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  totalPrice: number;
  lockExpiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  spot?: ParkingSpot;
  user?: User;
}

export interface BillingQuote {
  currency: "UAH";
  startTime: string;
  endTime: string;
  durationMinutes: number;
  subtotal: number;
  discount: number;
  totalPrice: number;
  appliedPromoCode: string | null;
  segments: Array<{
    from: string;
    to: string;
    minutes: number;
    hourlyRate: number;
    amount: number;
  }>;
}
