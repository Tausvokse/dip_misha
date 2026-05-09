import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/utils/formatCurrency";
import { useParkingStore } from "@/store/parking.store";
import type { ParkingSpot } from "@/types/parking.types";
import { PaymentForm } from "./PaymentForm";

export function ReserveModal({
  spot,
  onClose,
}: {
  spot: ParkingSpot | null;
  onClose: () => void;
}) {
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [step, setStep] = useState<"confirm" | "payment" | "success">("confirm");
  const createLock = useParkingStore((state) => state.createLock);
  const upsertSpot = useParkingStore((state) => state.upsertSpot);
  const quote = useParkingStore((state) => state.activeQuote);

  async function reserve() {
    if (!spot) return;
    await createLock(spot, durationMinutes);
    setStep("payment");
  }

  function handlePaid(vehiclePlate: string) {
    setStep("success");
    if (spot) {
      upsertSpot({ ...spot, status: "RESERVED", licensePlate: vehiclePlate } as any);
    }
    setTimeout(() => {
      onClose();
      setStep("confirm");
    }, 2500);
  }

  return (
    <Modal title={spot ? `Бронювання місця ${spot.number}` : "Бронювання"} isOpen={Boolean(spot)} onClose={onClose}>
      {spot ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-5 border border-slate-100 shadow-sm">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Паркомісце</p>
              <p className="text-3xl font-black text-slate-900">{spot.number}</p>
            </div>
            <Badge status={spot.status} className="px-4 py-2 text-sm">Вільне</Badge>
          </div>

          {step === "confirm" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {[60, 120, 180].map((minutes) => (
                  <Button
                    key={minutes}
                    variant={durationMinutes === minutes ? "primary" : "outline"}
                    onClick={() => setDurationMinutes(minutes)}
                    className="py-4 font-bold text-lg"
                  >
                    {minutes / 60} год
                  </Button>
                ))}
              </div>
              <Button className="w-full py-6 text-lg font-bold shadow-md bg-slate-900 hover:bg-slate-800" onClick={reserve}>
                Перейти до оплати
              </Button>
            </div>
          ) : null}

          {step === "payment" ? (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div className="rounded-xl bg-slate-900 p-6 text-white text-center shadow-inner">
                <p className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wide">Сума до сплати</p>
                <p className="text-5xl font-black text-emerald-400">{formatCurrency(quote?.totalPrice ?? durationMinutes / 60 * 50)}</p>
              </div>
              <PaymentForm onPaid={handlePaid} />
            </div>
          ) : null}

          {step === "success" ? (
            <div className="rounded-xl bg-emerald-50 border-2 border-emerald-200 p-8 text-emerald-700 text-center shadow-sm">
              <p className="text-2xl font-black mb-2">Резерв підтверджено!</p>
              <p className="text-md text-emerald-600 font-medium">Ваше місце {spot.number} успішно закріплено за вашим авто.</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}