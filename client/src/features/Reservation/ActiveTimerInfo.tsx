import { useState, useEffect } from "react";
import { Clock, CreditCard, Plus } from "lucide-react";
import { useCountdownTimer } from "@/hooks/useCountdownTimer";
import { useParkingStore } from "@/store/parking.store";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PaymentForm } from "./PaymentForm";
import { formatCurrency } from "@/utils/formatCurrency";

import type { Reservation } from "@/types/parking.types";
import { quoteReservation } from "@/api/parking.api";

export function ActiveTimerInfo({ mobile, reservation }: { mobile?: boolean; reservation: Reservation }) {
  const upsertSpot = useParkingStore((state) => state.upsertSpot);
  const completeActiveReservation = useParkingStore((state) => state.completeActiveReservation);
  const extendReservation = useParkingStore((state) => state.extendReservation);
  
  const isPending = reservation?.status === "PENDING_PAYMENT";
  const isReserved = reservation?.status === "RESERVED";
  
  const timerDate = isPending ? reservation?.lockExpiresAt : (isReserved ? reservation?.endTime : undefined);
  const timer = useCountdownTimer(timerDate);
  
  const [isPaying, setIsPaying] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [extendValue, setExtendValue] = useState(1);
  const [extendUnit, setExtendUnit] = useState<"hours"|"days">("hours");
  const [isExtendingLoading, setIsExtendingLoading] = useState(false);
  const [quotePrice, setQuotePrice] = useState<number | null>(null);

  useEffect(() => {
    if (isExtending && reservation) {
      const durationMinutes = extendUnit === "hours" ? extendValue * 60 : extendValue * 24 * 60;
      quoteReservation({
        startTime: reservation.endTime,
        durationMinutes,
      })
        .then(({ data }) => setQuotePrice(data.quote.totalPrice))
        .catch(() => setQuotePrice(null));
    }
  }, [extendValue, extendUnit, isExtending, reservation]);

  if (!reservation || (!isPending && !isReserved)) {
    return null;
  }

  function handlePaid(vehiclePlate: string) {
    if (reservation?.spot) {
      upsertSpot({ ...reservation.spot, status: "RESERVED", licensePlate: vehiclePlate });
    }
    completeActiveReservation(reservation.id);
    setIsPaying(false);
  }

  async function handleExtend() {
    if (!reservation) return;
    setIsExtendingLoading(true);
    const durationMinutes = extendUnit === "hours" ? extendValue * 60 : extendValue * 24 * 60;
    try {
      await extendReservation(reservation.id, durationMinutes);
      setIsExtending(false);
    } catch (e) {
      console.error(e);
      alert("Помилка при продовженні");
    } finally {
      setIsExtendingLoading(false);
    }
  }

  if (mobile) {
    return (
      <>
        <button 
          onClick={() => isPending ? setIsPaying(true) : setIsExtending(true)}
          className={`w-14 h-14 mx-auto rounded-full shadow-lg flex flex-col items-center justify-center text-white border-4 border-white transform transition-transform active:scale-95 ${isReserved ? 'bg-emerald-600' : 'bg-[#111827]'}`}
        >
          <Clock className="h-4 w-4 mb-0.5 text-[#D1D5DB]" />
          <span className="text-[10px] font-mono font-black">{timer.label}</span>
        </button>

        <Modal isOpen={isPaying} onClose={() => setIsPaying(false)} title={`Оплата місця ${reservation?.spot?.number}`}>
          <div className="p-1">
            <div className="mb-6 rounded-2xl bg-[#111827] p-6 text-white text-center shadow-xl">
              <p className="text-xs font-bold text-[#9CA3AF] mb-1 uppercase tracking-widest">До сплати</p>
              <p className="text-5xl font-black">{formatCurrency(Number(reservation?.totalPrice || 0))}</p>
            </div>
            <PaymentForm onPaid={handlePaid} reservation={reservation} />
          </div>
        </Modal>

        <Modal isOpen={isExtending} onClose={() => setIsExtending(false)} title={`Продовжити бронювання`}>
          <div className="p-4 space-y-4">
            <div className="flex gap-4">
              <input 
                type="number" 
                min="1" 
                value={extendValue} 
                onChange={(e) => setExtendValue(Number(e.target.value))} 
                className="w-full border-2 border-slate-200 rounded-xl p-3 text-lg font-bold"
              />
              <select 
                value={extendUnit} 
                onChange={(e) => setExtendUnit(e.target.value as "hours"|"days")} 
                className="w-full border-2 border-slate-200 rounded-xl p-3 text-lg font-bold bg-white"
              >
                <option value="hours">Годин</option>
                <option value="days">Днів</option>
              </select>
            </div>
            {quotePrice !== null && (
              <div className="text-center font-bold text-lg text-emerald-600 mb-2">
                До сплати: {formatCurrency(quotePrice)}
              </div>
            )}
            <Button onClick={handleExtend} disabled={isExtendingLoading} className="w-full bg-[#111827] text-white">
              Підтвердити
            </Button>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <>
      <div className={`rounded-2xl border-2 ${isReserved ? 'border-emerald-600' : 'border-[#111827]'} bg-white p-5 flex flex-col gap-4 shadow-sm relative overflow-hidden group`}>
        <div className={`absolute top-0 right-0 w-24 h-24 ${isReserved ? 'bg-emerald-50' : 'bg-[#F3F4F6]'} rounded-bl-full -z-10 transition-transform group-hover:scale-110`} />
        <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${isReserved ? 'text-emerald-700' : 'text-[#111827]'}`}>
          <Clock className="h-4 w-4" />
          {isReserved ? 'Активне бронювання' : 'Очікує оплати'}
        </div>
        <div className="flex items-end justify-between relative z-10">
          <div>
            <span className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Місце</span>
            <span className="text-2xl font-black text-[#111827]">#{reservation.spot?.number}</span>
          </div>
          <div className="text-right">
             <span className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">{isReserved ? 'Залишилось' : 'Час на оплату'}</span>
             <span className={`font-mono text-xl font-black ${isReserved ? 'text-emerald-600' : 'text-[#111827]'}`}>{timer.label}</span>
          </div>
        </div>
        {isPending ? (
          <Button 
            className="w-full bg-[#111827] hover:bg-[#374151] text-white font-bold py-3 mt-1 shadow-md relative z-10"
            onClick={() => setIsPaying(true)}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Оплатити
          </Button>
        ) : (
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 mt-1 shadow-md relative z-10"
            onClick={() => setIsExtending(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Продовжити
          </Button>
        )}
      </div>

      <Modal isOpen={isPaying} onClose={() => setIsPaying(false)} title={`Оплата місця ${reservation?.spot?.number}`}>
        <div className="p-1">
          <div className="mb-6 rounded-2xl bg-[#111827] p-6 text-white text-center shadow-xl">
            <p className="text-xs font-bold text-[#9CA3AF] mb-1 uppercase tracking-widest">До сплати</p>
            <p className="text-5xl font-black">{formatCurrency(Number(reservation?.totalPrice || 0))}</p>
          </div>
          <PaymentForm onPaid={handlePaid} reservation={reservation} />
        </div>
      </Modal>
      
      <Modal isOpen={isExtending} onClose={() => setIsExtending(false)} title={`Продовжити бронювання`}>
        <div className="p-4 space-y-4">
          <div className="flex gap-4">
            <input 
              type="number" 
              min="1" 
              value={extendValue} 
              onChange={(e) => setExtendValue(Number(e.target.value))} 
              className="w-full border-2 border-slate-200 rounded-xl p-3 text-lg font-bold"
            />
            <select 
              value={extendUnit} 
              onChange={(e) => setExtendUnit(e.target.value as "hours"|"days")} 
              className="w-full border-2 border-slate-200 rounded-xl p-3 text-lg font-bold bg-white"
            >
              <option value="hours">Годин</option>
              <option value="days">Днів</option>
            </select>
          </div>
          {quotePrice !== null && (
            <div className="text-center font-bold text-lg text-emerald-600 mb-2">
              До сплати: {formatCurrency(quotePrice)}
            </div>
          )}
          <Button onClick={handleExtend} disabled={isExtendingLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3">
            Підтвердити
          </Button>
        </div>
      </Modal>
    </>
  );
}
