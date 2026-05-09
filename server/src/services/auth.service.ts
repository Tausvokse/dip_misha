import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { env } from "../config/env.config";
import { prisma } from "../config/prisma.client";
import { createHttpError } from "../utils/AppError";
import { serializeUser } from "../utils/serializers";

type AuthUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
};

function signToken(user: AuthUser) {
  const options: SignOptions = {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(
    {
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    options,
  );
}

export async function registerUser(input: { email: string; password: string }) {
  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        password_hash: passwordHash,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return {
      user: serializeUser(user),
      token: signToken(user),
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw createHttpError(409, "EMAIL_ALREADY_EXISTS", "A user with this email already exists");
    }

    throw error;
  }
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user) {
    throw createHttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password_hash);
  if (!passwordMatches) {
    throw createHttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const publicUser = serializeUser(user);

  return {
    user: publicUser,
    token: signToken(publicUser),
  };
}


