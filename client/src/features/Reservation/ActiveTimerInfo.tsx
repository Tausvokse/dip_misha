import { useState } from "react";
import { Clock, CreditCard } from "lucide-react";
import { useCountdownTimer } from "@/hooks/useCountdownTimer";
import { useParkingStore } from "@/store/parking.store";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PaymentForm } from "./PaymentForm";
import { formatCurrency } from "@/utils/formatCurrency";

export function ActiveTimerInfo({ mobile }: { mobile?: boolean }) {
  const reservation = useParkingStore((state) => state.activeReservation);
  const upsertSpot = useParkingStore((state) => state.upsertSpot);
  const timer = useCountdownTimer(reservation?.lockExpiresAt);
  const [isPaying, setIsPaying] = useState(false);

  if (!reservation || reservation.status !== "PENDING_PAYMENT") {
    if (mobile) return null;
    return (
      <div className="rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-[#F9FAFB] p-5 text-sm text-[#9CA3AF] text-center font-medium">
        Активної броні немає
      </div>
    );
  }

  function handlePaid(vehiclePlate: string) {
    if (reservation?.spot) {
      upsertSpot({ ...reservation.spot, status: "RESERVED", licensePlate: vehiclePlate });
    }
    setIsPaying(false);
  }

  if (mobile) {
    return (
      <>
        <button 
          onClick={() => setIsPaying(true)}
          className="w-14 h-14 mx-auto bg-[#111827] rounded-full shadow-lg flex flex-col items-center justify-center text-white border-4 border-white transform transition-transform active:scale-95"
        >
          <Clock className="h-4 w-4 mb-0.5 text-[#D1D5DB]" />
          <span className="text-[10px] font-mono font-black">{timer.label}</span>
        </button>

        <Modal 
          isOpen={isPaying} 
          onClose={() => setIsPaying(false)}
          title={`Оплата місця ${reservation?.spot?.number}`}
        >
          <div className="p-1">
            <div className="mb-6 rounded-2xl bg-[#111827] p-6 text-white text-center shadow-xl">
              <p className="text-xs font-bold text-[#9CA3AF] mb-1 uppercase tracking-widest">До сплати</p>
              <p className="text-5xl font-black">{formatCurrency(Number(reservation?.totalPrice || 0))}</p>
            </div>
            <PaymentForm onPaid={handlePaid} reservation={reservation} />
          </div>
        </Modal>
      </>
    );
  }

  return (
    <>
      <div className="rounded-2xl border-2 border-[#111827] bg-white p-5 flex flex-col gap-4 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#F3F4F6] rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#111827]">
          <Clock className="h-4 w-4" />
          Бронювання
        </div>
        <div className="flex items-end justify-between relative z-10">
          <div>
            <span className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Місце</span>
            <span className="text-2xl font-black text-[#111827]">#{reservation.spot?.number}</span>
          </div>
          <div className="text-right">
             <span className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Час</span>
             <span className="font-mono text-xl font-black text-[#111827]">{timer.label}</span>
          </div>
        </div>
        <Button 
          className="w-full bg-[#111827] hover:bg-[#374151] text-white font-bold py-3 mt-1 shadow-md relative z-10"
          onClick={() => setIsPaying(true)}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Оплатити
        </Button>
      </div>

      <Modal 
        isOpen={isPaying} 
        onClose={() => setIsPaying(false)}
        title={`Оплата місця ${reservation?.spot?.number}`}
      >
        <div className="p-1">
          <div className="mb-6 rounded-2xl bg-[#111827] p-6 text-white text-center shadow-xl">
            <p className="text-xs font-bold text-[#9CA3AF] mb-1 uppercase tracking-widest">До сплати</p>
            <p className="text-5xl font-black">{formatCurrency(Number(reservation?.totalPrice || 0))}</p>
          </div>
          <PaymentForm onPaid={handlePaid} reservation={reservation} />
        </div>
      </Modal>
    </>
  );
}
