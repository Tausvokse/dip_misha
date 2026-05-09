import { Router } from "express";
import {
  getSpot,
  idOrNumberParamsSchema,
  listSpots,
  maintenanceSchema,
  setMaintenance,
  updateSpotStatus,
  updateSpotStatusSchema,
} from "../controllers/parking.controller";
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";

export const parkingRouter = Router();

parkingRouter.get("/", listSpots);
parkingRouter.get("/:idOrNumber", validate({ params: idOrNumberParamsSchema }), getSpot);
parkingRouter.patch(
  "/:idOrNumber/status",
  authenticate,
  authorizeRoles("ADMIN"),
  validate({ params: idOrNumberParamsSchema, body: updateSpotStatusSchema }),
  updateSpotStatus,
);
parkingRouter.patch(
  "/:idOrNumber/maintenance",
  authenticate,
  authorizeRoles("ADMIN"),
  validate({ params: idOrNumberParamsSchema, body: maintenanceSchema }),
  setMaintenance,
);


