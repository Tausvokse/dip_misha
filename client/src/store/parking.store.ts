import { create } from "zustand";
import { getSpots, lockSpot, unlockSpot } from "@/api/parking.api";
import { api } from "@/api/axios.instance";
import type { BillingQuote, ParkingSpot, Reservation } from "@/types/parking.types";

type ParkingState = {
  spots: ParkingSpot[];
  activeReservations: Reservation[];
  activeQuote: BillingQuote | null;
  isLoading: boolean;
  selectedSpot: ParkingSpot | null;
  setSelectedSpot: (spot: ParkingSpot | null) => void;
  setSpots: (spots: ParkingSpot[]) => void;
  upsertSpot: (spot: ParkingSpot) => void;
  fetchSpots: () => Promise<void>;
  createLock: (spot: ParkingSpot, durationMinutes: number, startTime?: string) => Promise<Reservation>;
  clearActiveReservation: (id: string) => void;
  completeActiveReservation: (id: string) => void;
  fetchActiveReservations: () => Promise<void>;
  extendReservation: (id: string, durationMinutes: number) => Promise<void>;
};

export const useParkingStore = create<ParkingState>((set, get) => ({
  spots: [],
  activeReservations: [],
  activeQuote: null,
  isLoading: false,
  selectedSpot: null,
  setSelectedSpot: (spot) => set({ selectedSpot: spot }),
  setSpots: (spots) => set({ spots }),
  upsertSpot: (spot) =>
    set((state) => ({
      spots: state.spots.map((item) => (item.id === spot.id ? { ...item, ...spot } : item)),
      selectedSpot: state.selectedSpot?.id === spot.id ? { ...state.selectedSpot, ...spot } : state.selectedSpot,
    })),
  fetchSpots: async () => {
    set({ isLoading: true });
    try {
      const { data } = await getSpots();
      set({ spots: data.spots });
    } finally {
      set({ isLoading: false });
    }
  },
  fetchActiveReservations: async () => {
    try {
      const { data } = await api.get("/profile/active-reservations");
      if (data.reservations) {
        set({ activeReservations: data.reservations });
        data.reservations.forEach((reservation: Reservation) => {
          if (reservation.spot) {
            get().upsertSpot(reservation.spot);
          }
        });
      } else {
        set({ activeReservations: [] });
      }
    } catch (error) {
      console.error("Failed to fetch active reservations", error);
    }
  },
  createLock: async (spot, durationMinutes, startTime) => {
    const { data } = await lockSpot({
      spotId: spot.id,
      durationMinutes,
      startTime,
    });

    if (data.reservation.spot) {
      get().upsertSpot(data.reservation.spot);
    }

    set((state) => ({
      activeReservations: [...state.activeReservations.filter((r) => r.id !== data.reservation.id), data.reservation],
      activeQuote: data.quote ?? null,
    }));

    return data.reservation;
  },
  clearActiveReservation: async (id) => {
    const current = get().activeReservations.find(r => r.id === id);
    if (current?.status === "PENDING_PAYMENT") {
      await unlockSpot(current.id).catch(() => undefined);
    }
    set((state) => ({ 
      activeReservations: state.activeReservations.filter(r => r.id !== id),
      activeQuote: null 
    }));
  },
  completeActiveReservation: (id) => {
    set((state) => ({ 
      activeReservations: state.activeReservations.map(r => 
        r.id === id ? { ...r, status: "RESERVED" } : r
      ), 
      activeQuote: null 
    }));
  },
  extendReservation: async (id, durationMinutes) => {
    const { data } = await api.post(`/reservations/${id}/extend`, { durationMinutes });
    if (data.reservation) {
      set((state) => ({
        activeReservations: state.activeReservations.map(r => 
          r.id === data.reservation.id ? data.reservation : r
        )
      }));
    }
  },
}));