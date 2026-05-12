import { Role } from "../types/enums";
﻿import jwt from "jsonwebtoken";

import { env } from "../config/env.config";
import { prisma } from "../config/prisma.client";
import { asyncHandler } from "../utils/catchAsync";
import { createHttpError } from "../utils/AppError";

type TokenPayload = {
  sub: string;
  email: string;
  role: Role;
};

function getBearerToken(authorization?: string) {
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

async function readUserFromToken(token: string) {
  const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true } });

  if (!user) {
    throw createHttpError(401, "AUTH_USER_NOT_FOUND", "Authenticated user does not exist");
  }

  return { ...user, role: user.role as Role };
}

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    throw createHttpError(401, "AUTH_TOKEN_REQUIRED", "Authorization Bearer token is required");
  }

  req.user = await readUserFromToken(token);
  next();
});

export const optionalAuthenticate = asyncHandler(async (req, _res, next) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    next();
    return;
  }

  req.user = await readUserFromToken(token);
  next();
});

export function authorizeRoles(...roles: Role[]) {
  return asyncHandler(async (req, _res, next) => {
    if (!req.user) {
      throw createHttpError(401, "AUTH_TOKEN_REQUIRED", "Authorization Bearer token is required");
    }

    if (!roles.includes(req.user.role)) {
      throw createHttpError(403, "FORBIDDEN", "You do not have permission for this action");
    }

    next();
  });
}


