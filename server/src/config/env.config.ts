import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  JWT_SECRET: z
    .string()
    .min(24)
    .default("change-this-development-secret-at-least-32-chars"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  RESERVATION_LOCK_MINUTES: z.coerce.number().positive().default(10),
  DAY_RATE_UAH: z.coerce.number().positive().default(50),
  NIGHT_RATE_UAH: z.coerce.number().positive().default(25),
  NIGHT_START_HOUR: z.coerce.number().int().min(0).max(23).default(22),
  NIGHT_END_HOUR: z.coerce.number().int().min(0).max(23).default(6),
});

export const env = envSchema.parse(process.env);

export const corsOrigins =
  env.CORS_ORIGIN.trim() === "*"
    ? true
    : env.CORS_ORIGIN.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);


