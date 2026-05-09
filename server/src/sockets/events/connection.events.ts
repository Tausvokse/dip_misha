import type { Socket } from "socket.io";
import { registerSocket, unregisterSocket } from "../socket.manager";

export function registerConnectionEvents(socket: Socket) {
  registerSocket(socket);

  socket.on("disconnect", () => {
    unregisterSocket(socket.id);
  });
}
