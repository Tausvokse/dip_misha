import type { BillingQuote, ParkingSpot, Reservation } from "./parking.types";
import type { User } from "./user.types";

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SpotsResponse {
  spots: ParkingSpot[];
  total: number;
}

export interface ReservationResponse {
  reservation: Reservation;
  quote?: BillingQuote;
}

export interface AdminStatsResponse {
  spots: {
    total: number;
    FREE: number;
    LOCKED: number;
    RESERVED: number;
    MAINTENANCE: number;
  };
  reservations: Record<string, number>;
  occupancyRate: number;
  revenue: {
    currency: "UAH";
    today: number;
    last7Days: number;
    last30Days: number;
  };
  chart: Array<{
    date: string;
    revenue: number;
    reservations: number;
  }>;
  recentReservations: Reservation[];
}
