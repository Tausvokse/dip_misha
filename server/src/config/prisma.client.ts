import { PrismaClient } from "@prisma/client";
import { env } from "./env.config";

export const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export async function disconnectPrisma() {
  await prisma.$disconnect();
}


