import type { Socket } from "socket.io";
import { prisma } from "../../config/prisma.client";
import { serializeSpot } from "../../utils/serializers";

export function registerParkingEvents(socket: Socket) {
  socket.on("subscribeParking", () => {
    socket.join("parking");
  });

  socket.on("unsubscribeParking", () => {
    socket.leave("parking");
  });

  socket.on("joinReservation", (payload: { reservationId?: string }) => {
    if (payload?.reservationId) {
      socket.join(`reservation:${payload.reservationId}`);
    }
  });

  socket.on("leaveReservation", (payload: { reservationId?: string }) => {
    if (payload?.reservationId) {
      socket.leave(`reservation:${payload.reservationId}`);
    }
  });

  socket.on("requestSpots", async () => {
    const spots = await prisma.parkingSpot.findMany({
      orderBy: { number: "asc" },
    });

    socket.emit("spotsSnapshot", {
      spots: spots.map(serializeSpot),
      serverTime: new Date().toISOString(),
    });
  });
}
