CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

CREATE TYPE "ParkingSpotStatus" AS ENUM ('FREE', 'LOCKED', 'RESERVED', 'MAINTENANCE');

CREATE TYPE "ReservationStatus" AS ENUM ('PENDING_PAYMENT', 'RESERVED', 'CANCELLED', 'EXPIRED', 'COMPLETED');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParkingSpot" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "ParkingSpotStatus" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParkingSpot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "lockExpiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE UNIQUE INDEX "ParkingSpot_number_key" ON "ParkingSpot"("number");

CREATE INDEX "Reservation_userId_status_idx" ON "Reservation"("userId", "status");

CREATE INDEX "Reservation_spotId_status_idx" ON "Reservation"("spotId", "status");

CREATE INDEX "Reservation_startTime_endTime_idx" ON "Reservation"("startTime", "endTime");

CREATE INDEX "Reservation_lockExpiresAt_idx" ON "Reservation"("lockExpiresAt");

ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "ParkingSpot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
