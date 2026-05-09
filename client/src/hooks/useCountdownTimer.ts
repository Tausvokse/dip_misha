import { useEffect, useMemo, useState } from "react";

export function useCountdownTimer(targetDate?: string | null) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  return useMemo(() => {
    if (!targetDate) {
      return { secondsLeft: 0, label: "00:00", isExpired: true };
    }

    const secondsLeft = Math.max(0, Math.ceil((new Date(targetDate).getTime() - now) / 1000));
    const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const seconds = String(secondsLeft % 60).padStart(2, "0");

    return {
      secondsLeft,
      label: `${minutes}:${seconds}`,
      isExpired: secondsLeft <= 0,
    };
  }, [now, targetDate]);
}
