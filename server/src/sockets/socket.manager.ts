import type { Socket } from "socket.io";

const connectedSockets = new Map<string, Socket>();

export function registerSocket(socket: Socket) {
  connectedSockets.set(socket.id, socket);
}

export function unregisterSocket(socketId: string) {
  connectedSockets.delete(socketId);
}

export function getConnectedSocketCount() {
  return connectedSockets.size;
}
