import { Router } from "express";
import { adminRouter } from "./admin.routes";
import { authRouter } from "./auth.routes";
import { paymentRouter } from "./payment.routes";
import { profileRouter } from "./profile.routes";
import { reservationsRouter } from "./reservations.routes";
import { parkingRouter } from "./parking.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/spots", parkingRouter);
apiRouter.use("/reservations", reservationsRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/admin", adminRouter);


