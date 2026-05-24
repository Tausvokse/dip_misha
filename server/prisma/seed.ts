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
  await prisma.paymentMethod.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.userProfile.deleteMany();
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

  await prisma.vehicle.create({
    data: {
      userId: user.id,
      make: "Toyota",
      model: "Camry",
      licensePlate: "AA1234BB",
      color: "Чорний",
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

  const spots = [];
  for (let index = 1; index <= 48; index += 1) {
    const number = `P${String(index).padStart(2, "0")}`;
    const spot = await prisma.parkingSpot.create({
      data: {
        number,
        status: ParkingSpotStatus.FREE,
      },
    });
    spots.push(spot);
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
