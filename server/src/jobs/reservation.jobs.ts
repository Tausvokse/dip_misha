import cron, { type ScheduledTask } from "node-cron";
import {
  completeFinishedReservations,
  restorePendingReservationTimers,
} from "../services/parking.service";

let task: ScheduledTask | null = null;

export async function startReservationJobs() {
  await restorePendingReservationTimers();
  await completeFinishedReservations();

  task = cron.schedule("* * * * *", async () => {
    try {
      await restorePendingReservationTimers();
      await completeFinishedReservations();
    } catch (error) {
      console.error(error);
    }
  });

  return task;
}

export function stopReservationJobs() {
  task?.stop();
  task = null;
}


