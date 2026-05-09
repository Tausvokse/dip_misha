import { Router } from "express";
import {
  adminReservationsQuerySchema,
  reservations,
  spots,
  stats,
} from "../controllers/admin.controller";
import {
  idOrNumberParamsSchema,
  maintenanceSchema,
  setMaintenance,
  updateSpotStatus,
  updateSpotStatusSchema,
} from "../controllers/parking.controller";
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";

export const adminRouter = Router();

adminRouter.use(authenticate, authorizeRoles("ADMIN"));

adminRouter.get("/stats", stats);
adminRouter.get(
  "/reservations",
  validate({ query: adminReservationsQuerySchema }),
  reservations,
);
adminRouter.get("/spots", spots);
adminRouter.patch(
  "/spots/:idOrNumber/status",
  validate({ params: idOrNumberParamsSchema, body: updateSpotStatusSchema }),
  updateSpotStatus,
);
adminRouter.patch(
  "/spots/:idOrNumber/maintenance",
  validate({ params: idOrNumberParamsSchema, body: maintenanceSchema }),
  setMaintenance,
);


