import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { corsOrigins } from "../config/env.config";
import { registerConnectionEvents } from "./events/connection.events";
import { registerParkingEvents } from "./events/parking.events";

let io: Server | null = null;

export function initializeSocketServer(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.join("parking");
    socket.emit("connected", {
      socketId: socket.id,
      serverTime: new Date().toISOString(),
    });

    registerConnectionEvents(socket);
    registerParkingEvents(socket);
  });

  return io;
}

export function getSocketServer() {
  return io;
}

export function emitParkingEvent(event: string, payload: unknown) {
  io?.to("parking").emit(event, payload);
}

export function emitReservationEvent(
  reservationId: string,
  event: string,
  payload: unknown,
) {
  io?.to(`reservation:${reservationId}`).emit(event, payload);
}
