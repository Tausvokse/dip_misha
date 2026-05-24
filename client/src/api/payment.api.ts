import { api } from "./axios.instance";
import type { ReservationResponse } from "@/types/api.types";
import type { Reservation } from "@/types/parking.types";

export function processPayment(payload: {
  reservationId: string;
  providerPaymentId?: string;
  cardLast4?: string;
  vehiclePlate?: string;
}) {
  return api.post<ReservationResponse>("/payments/confirm", payload);
}

export function getPaymentHistory() {
  return api.get<{
    payments: Array<{
      id: string;
      amount: number;
      currency: "UAH";
      status: Reservation["status"];
      paidAt: string | null;
      reservation: Reservation;
    }>;
  }>("/payments/history");
}
