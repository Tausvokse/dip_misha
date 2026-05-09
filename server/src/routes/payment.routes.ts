import { Router } from "express";
import {
  confirmPayment,
  paymentConfirmByParamSchema,
  confirmPaymentByParam,
  paymentConfirmSchema,
  paymentHistory,
  paymentReservationParamsSchema,
} from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";

export const paymentRouter = Router();

paymentRouter.get("/history", authenticate, paymentHistory);
paymentRouter.post(
  "/confirm",
  authenticate,
  validate({ body: paymentConfirmSchema }),
  confirmPayment,
);
paymentRouter.post(
  "/:reservationId/confirm",
  authenticate,
  validate({
    params: paymentReservationParamsSchema,
    body: paymentConfirmByParamSchema,
  }),
  confirmPaymentByParam,
);


