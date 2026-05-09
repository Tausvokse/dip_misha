import { useEffect } from "react";
import { io } from "socket.io-client";
import { useParkingStore } from "@/store/parking.store";
import type { ParkingSpot, Reservation } from "@/types/parking.types";

type SpotPayload = {
  spot?: ParkingSpot;
  reservation?: Reservation;
};

export function useSocket(enabled = true) {
  const upsertSpot = useParkingStore((state) => state.upsertSpot);
  const setSpots = useParkingStore((state) => state.setSpots);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL ?? "http://localhost:4000", {
      transports: ["websocket", "polling"],
    });

    socket.emit("subscribeParking");
    socket.emit("requestSpots");

    socket.on("spotsSnapshot", (payload: { spots: ParkingSpot[] }) => {
      setSpots(payload.spots);
    });

    const handleSpotPayload = (payload: SpotPayload) => {
      if (payload.spot) {
        upsertSpot(payload.spot);
      }
    };

    socket.on("spotUpdated", handleSpotPayload);
    socket.on("reservationLocked", handleSpotPayload);
    socket.on("paymentConfirmed", handleSpotPayload);
    socket.on("lockExpired", handleSpotPayload);
    socket.on("reservationCompleted", handleSpotPayload);

    return () => {
      socket.emit("unsubscribeParking");
      socket.disconnect();
    };
  }, [enabled, setSpots, upsertSpot]);
}
