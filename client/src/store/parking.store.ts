import { create } from "zustand";
import { getSpots, lockSpot, unlockSpot } from "@/api/parking.api";
import { api } from "@/api/axios.instance";
import type { BillingQuote, ParkingSpot, Reservation } from "@/types/parking.types";

type ParkingState = {
  spots: ParkingSpot[];
  activeReservation: Reservation | null;
  activeQuote: BillingQuote | null;
  isLoading: boolean;
  selectedSpot: ParkingSpot | null;
  setSelectedSpot: (spot: ParkingSpot | null) => void;
  setSpots: (spots: ParkingSpot[]) => void;
  upsertSpot: (spot: ParkingSpot) => void;
  fetchSpots: () => Promise<void>;
  createLock: (spot: ParkingSpot, durationMinutes: number) => Promise<Reservation>;
  clearActiveReservation: () => void;
  fetchActiveReservation: () => Promise<void>;
};

export const useParkingStore = create<ParkingState>((set, get) => ({
  spots: [],
  activeReservation: null,
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
  fetchActiveReservation: async () => {
    try {
      const { data } = await api.get("/profile/active-reservation");
      if (data.reservation) {
        set({ activeReservation: data.reservation });
        if (data.reservation.spot) {
          get().upsertSpot(data.reservation.spot);
        }
      } else {
        set({ activeReservation: null });
      }
    } catch (error) {
      console.error("Failed to fetch active reservation", error);
    }
  },
  createLock: async (spot, durationMinutes) => {
    const { data } = await lockSpot({
      spotId: spot.id,
      durationMinutes,
    });

    if (data.reservation.spot) {
      get().upsertSpot(data.reservation.spot);
    }

    set({
      activeReservation: data.reservation,
      activeQuote: data.quote ?? null,
      selectedSpot: null,
    });

    return data.reservation;
  },
  clearActiveReservation: async () => {
    const current = get().activeReservation;
    if (current?.status === "PENDING_PAYMENT") {
      await unlockSpot(current.id).catch(() => undefined);
    }
    set({ activeReservation: null, activeQuote: null });
  },
}));