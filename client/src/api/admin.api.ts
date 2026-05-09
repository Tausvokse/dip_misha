import { api } from "./axios.instance";
import type { AdminStatsResponse } from "@/types/api.types";
import type { ParkingSpot, Reservation } from "@/types/parking.types";

export function getStats() {
  return api.get<AdminStatsResponse>("/admin/stats");
}

export function getAdminReservations() {
  return api.get<{ reservations: Reservation[] }>("/admin/reservations");
}

export function getAdminSpots() {
  return api.get<{ spots: ParkingSpot[] }>("/admin/spots");
}

export function blockSpotMaintenance(idOrNumber: string, enabled: boolean) {
  return api.patch<{ spot: ParkingSpot }>(`/admin/spots/${idOrNumber}/maintenance`, {
    enabled,
    force: true,
  });
}
