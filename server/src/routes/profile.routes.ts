import { Router } from "express";
import {
  activeReservation,
  createPaymentMethod,
  createVehicle,
  deletePaymentMethod,
  deleteVehicle,
  listPaymentMethods,
  listVehicles,
  paymentMethodParamsSchema,
  paymentMethodSchema,
  payments,
  profile,
  reservations,
  updatePaymentMethod,
  updateProfile,
  updateProfileSchema,
  updateVehicle,
  vehicleParamsSchema,
  vehicleSchema,
} from "../controllers/profile.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";

export const profileRouter = Router();

profileRouter.get("/", authenticate, profile);
profileRouter.put("/", authenticate, validate({ body: updateProfileSchema }), updateProfile);
profileRouter.get("/active-reservation", authenticate, activeReservation);
profileRouter.get("/reservations", authenticate, reservations);
profileRouter.get("/payments", authenticate, payments);
profileRouter.get("/vehicles", authenticate, listVehicles);
profileRouter.post("/vehicles", authenticate, validate({ body: vehicleSchema }), createVehicle);
profileRouter.put(
  "/vehicles/:vehicleId",
  authenticate,
  validate({ params: vehicleParamsSchema, body: vehicleSchema }),
  updateVehicle,
);
profileRouter.delete(
  "/vehicles/:vehicleId",
  authenticate,
  validate({ params: vehicleParamsSchema }),
  deleteVehicle,
);
profileRouter.get("/payment-methods", authenticate, listPaymentMethods);
profileRouter.post(
  "/payment-methods",
  authenticate,
  validate({ body: paymentMethodSchema }),
  createPaymentMethod,
);
profileRouter.put(
  "/payment-methods/:paymentMethodId",
  authenticate,
  validate({ params: paymentMethodParamsSchema, body: paymentMethodSchema }),
  updatePaymentMethod,
);
profileRouter.delete(
  "/payment-methods/:paymentMethodId",
  authenticate,
  validate({ params: paymentMethodParamsSchema }),
  deletePaymentMethod,
);


