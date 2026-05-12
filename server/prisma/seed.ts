import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import {
  ParkingSpotStatus,
  ReservationStatus,
  Role,
  PaymentMethodType,
  CardBrand,
} from "../src/types/enums";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);
  const adminPasswordHash = await bcrypt.hash("admin12345", 12);

  await prisma.reservation.deleteMany();
  await prisma.parkingSpot.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "user@parking.local",
      password_hash: passwordHash,
      role: Role.USER,
      profile: {
        create: {
          firstName: "Олексій",
          lastName: "Мельник",
          middleName: "Іванович",
          phone: "+380671234567",
        },
      },
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@parking.local",
      password_hash: adminPasswordHash,
      role: Role.ADMIN,
      profile: {
        create: {
          firstName: "Олег",
          lastName: "Коваль",
          middleName: "Петрович",
          phone: "+380501112233",
        },
      },
    },
  });

  const userVehicle = await prisma.vehicle.create({
    data: {
      userId: user.id,
      make: "Toyota",
      model: "Camry",
      licensePlate: "AA1234BB",
      color: "Чорний",
      isDefault: true,
    },
  });

  await prisma.vehicle.create({
    data: {
      userId: user.id,
      make: "Volkswagen",
      model: "Golf",
      licensePlate: "BC5678KX",
      color: "Білий",
    },
  });

  await prisma.vehicle.create({
    data: {
      userId: admin.id,
      make: "Tesla",
      model: "Model 3",
      licensePlate: "KA0001AD",
      color: "Сірий",
      isDefault: true,
    },
  });

  const cardPaymentMethod = await prisma.paymentMethod.create({
    data: {
      userId: user.id,
      type: PaymentMethodType.CARD,
      brand: CardBrand.VISA,
      label: "Visa •••• 4242",
      last4: "4242",
      isDefault: true,
    },
  });

  await prisma.paymentMethod.createMany({
    data: [
      {
        userId: user.id,
        type: PaymentMethodType.APPLE_PAY,
        label: "Apple Pay",
      },
      {
        userId: user.id,
        type: PaymentMethodType.GOOGLE_PAY,
        label: "Google Pay",
      },
    ],
  });

  const lockedSpotNumbers = new Set(["P07"]);
  const reservedSpotNumbers = new Set([
    "P03",
    "P06",
    "P10",
    "P17",
    "P20",
    "P24",
    "P34",
  ]);
  const maintenanceSpotNumbers = new Set(["P11", "P28"]);

  const spots = [];
  for (let index = 1; index <= 48; index += 1) {
    const number = `P${String(index).padStart(2, "0")}`;
    const status = lockedSpotNumbers.has(number)
      ? ParkingSpotStatus.LOCKED
      : reservedSpotNumbers.has(number)
        ? ParkingSpotStatus.RESERVED
        : maintenanceSpotNumbers.has(number)
          ? ParkingSpotStatus.MAINTENANCE
          : ParkingSpotStatus.FREE;

    const spot = await prisma.parkingSpot.create({
      data: {
        number,
        status,
      },
    });
    spots.push(spot);
  }

  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);

  const lockedSpot = spots.find((spot) => spot.number === "P07");
  if (lockedSpot) {
    await prisma.reservation.create({
      data: {
        userId: user.id,
        spotId: lockedSpot.id,
        vehicleId: userVehicle.id,
        startTime: now,
        endTime: twoHoursLater,
        status: ReservationStatus.PENDING_PAYMENT,
        totalPrice: 100,
        lockExpiresAt: tenMinutesLater,
      },
    });
  }

  for (const number of reservedSpotNumbers) {
    const spot = spots.find((item) => item.number === number);
    if (!spot) {
      continue;
    }

    await prisma.reservation.create({
      data: {
        userId: user.id,
        spotId: spot.id,
        vehicleId: userVehicle.id,
        paymentMethodId: cardPaymentMethod.id,
        startTime: now,
        endTime: twoHoursLater,
        status: ReservationStatus.RESERVED,
        totalPrice: 100,
        paidAt: now,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
