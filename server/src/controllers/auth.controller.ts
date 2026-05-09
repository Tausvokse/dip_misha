import { z } from "zod";
import { asyncHandler } from "../utils/catchAsync";
import { loginUser, registerUser } from "../services/auth.service";
import { serializeUser } from "../utils/serializers";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);
  res.json(result);
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    user: req.user ? serializeUser(req.user) : null,
  });
});


