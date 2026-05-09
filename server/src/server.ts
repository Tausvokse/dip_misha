import http from "http";
import { env } from "./config/env.config";
import { disconnectPrisma, prisma } from "./config/prisma.client";
import { createApp } from "./app";
import { initializeSocketServer } from "./sockets";
import {
  startReservationJobs,
  stopReservationJobs,
} from "./jobs/reservation.jobs";

async function bootstrap() {
  await prisma.$connect();

  const app = createApp();
  const server = http.createServer(app);

  initializeSocketServer(server);
  await startReservationJobs();

  server.listen(env.PORT, () => {
    console.log(`Parking backend is running on http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received. Shutting down...`);
    stopReservationJobs();
    server.close(async () => {
      await disconnectPrisma();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

bootstrap().catch(async (error) => {
  console.error(error);
  stopReservationJobs();
  await disconnectPrisma();
  process.exit(1);
});


