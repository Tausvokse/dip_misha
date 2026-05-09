import { api } from "./axios.instance";
import type { BillingQuote, ParkingSpot } from "@/types/parking.types";
import type { ReservationResponse, SpotsResponse } from "@/types/api.types";

export function getSpots() {
  return api.get<SpotsResponse>("/spots");
}

export function quoteReservation(payload: {
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  promoCode?: string | null;
}) {
  return api.post<{ quote: BillingQuote }>("/reservations/quote", payload);
}

export function lockSpot(payload: {
  spotId?: string;
  spotNumber?: string;
  durationMinutes: number;
  promoCode?: string | null;
}) {
  return api.post<ReservationResponse>("/reservations/lock", payload);
}

export function unlockSpot(reservationId: string) {
  return api.post<ReservationResponse>(`/reservations/${reservationId}/cancel`);
}

export function updateSpotStatus(idOrNumber: string, status: ParkingSpot["status"]) {
  return api.patch<{ spot: ParkingSpot }>(`/admin/spots/${idOrNumber}/status`, {
    status,
    force: true,
  });
}
