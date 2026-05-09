import { Router } from "express";
import {
  cancel,
  getReservation,
  lockReservation,
  myReservations,
  quoteReservation,
  quoteSchema,
  reservationIdParamsSchema,
  reservationLockSchema,
} from "../controllers/reservations.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  confirmPaymentByParam,
  paymentConfirmByParamSchema,
  paymentReservationParamsSchema,
} from "../controllers/payment.controller";

export const reservationsRouter = Router();

reservationsRouter.post("/quote", validate({ body: quoteSchema }), quoteReservation);
reservationsRouter.post(
  "/lock",
  authenticate,
  validate({ body: reservationLockSchema }),
  lockReservation,
);
reservationsRouter.post(
  "/",
  authenticate,
  validate({ body: reservationLockSchema }),
  lockReservation,
);
reservationsRouter.get("/me", authenticate, myReservations);
reservationsRouter.get(
  "/:id",
  authenticate,
  validate({ params: reservationIdParamsSchema }),
  getReservation,
);
reservationsRouter.post(
  "/:id/cancel",
  authenticate,
  validate({ params: reservationIdParamsSchema }),
  cancel,
);
reservationsRouter.delete(
  "/:id",
  authenticate,
  validate({ params: reservationIdParamsSchema }),
  cancel,
);
reservationsRouter.post(
  "/:reservationId/pay",
  authenticate,
  validate({
    params: paymentReservationParamsSchema,
    body: paymentConfirmByParamSchema,
  }),
  confirmPaymentByParam,
);


