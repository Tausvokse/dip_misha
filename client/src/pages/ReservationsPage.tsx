import { useEffect, useState } from "react";
import { Clock, MapPin, Car, CreditCard, ChevronRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/api/axios.instance";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { PaymentForm } from "@/features/Reservation/PaymentForm";
import { useParkingStore } from "@/store/parking.store";

export function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingReservation, setPayingReservation] = useState<any | null>(null);
  const { upsertSpot } = useParkingStore();

  useEffect(() => {
    loadReservations();
  }, []);

  async function loadReservations() {
    setIsLoading(true);
    try {
      const { data } = await api.get("/profile/reservations");
      setReservations(data.reservations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  function handlePaid(vehiclePlate: string) {
    if (payingReservation?.spot) {
      upsertSpot({ ...payingReservation.spot, status: "RESERVED", licensePlate: vehiclePlate });
    }
    setPayingReservation(null);
    loadReservations();
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Мої бронювання</h1>
            <p className="text-slate-500 mt-1">Переглядайте активні та минулі бронювання місць.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-sm font-bold text-slate-700">{reservations.filter(r => r.status === 'RESERVED').length} Активних</span>
          </div>
        </header>
        
        {isLoading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reservations.map((res) => (
              <div 
                key={res.id} 
                className="group relative bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xl">
                        {res.spot?.number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900">Паркомісце #{res.spot?.number}</h3>
                          <Badge status={res.status} className="text-[10px] py-0.5">{res.status}</Badge>
                        </div>
                        <div className="flex items-center text-slate-500 text-xs mt-0.5 gap-3">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Сектор A</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(res.startTime)}</span>
                        </div>
                      </div>
                    </div>

                    {res.vehicle && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                        <Car className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">{res.vehicle.licensePlate}</span>
                        <span className="text-xs text-slate-400">({res.vehicle.make} {res.vehicle.model})</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:flex-col md:items-end gap-4">
                    <div className="text-left md:text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Сума</p>
                      <p className="text-2xl font-black text-slate-900">{formatCurrency(Number(res.totalPrice))}</p>
                    </div>

                    {res.status === "PENDING_PAYMENT" ? (
                      <Button 
                        onClick={() => setPayingReservation(res)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 rounded-xl shadow-lg shadow-emerald-100 flex items-center gap-2 animate-bounce md:animate-none"
                      >
                        <CreditCard className="h-4 w-4" /> Оплатити зараз
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-400 text-sm font-medium">
                        Деталі <ChevronRight className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {reservations.length === 0 && (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
                <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                   <Clock className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Немає бронювань</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-1">Ви ще не бронювали місця на нашому паркінгу.</p>
                <Button variant="primary" className="mt-6" onClick={() => window.location.href = '/'}>Забронювати зараз</Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal 
        isOpen={Boolean(payingReservation)} 
        onClose={() => setPayingReservation(null)}
        title={`Оплата бронювання місця ${payingReservation?.spot?.number}`}
      >
        <div className="p-1">
          <div className="mb-6 rounded-2xl bg-slate-900 p-6 text-white text-center shadow-xl">
            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">До сплати</p>
            <p className="text-5xl font-black text-emerald-400">{formatCurrency(Number(payingReservation?.totalPrice || 0))}</p>
          </div>
          {payingReservation && (
            <PaymentForm onPaid={handlePaid} reservation={payingReservation} />
          )}
          </div>
          </Modal>
    </MainLayout>
  );
}