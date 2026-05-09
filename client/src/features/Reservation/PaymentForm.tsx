import { useState, useEffect } from "react";
import { CreditCard, CheckCircle2, Car, Smartphone, Wallet } from "lucide-react";
import { processPayment } from "@/api/payment.api";
import { api } from "@/api/axios.instance";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useParkingStore } from "@/store/parking.store";

export function PaymentForm({ onPaid, reservation: propReservation }: { onPaid: (vehiclePlate: string) => void, reservation?: any }) {
  const [card, setCard] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const storeReservation = useParkingStore((state) => state.activeReservation);
  
  const reservation = propReservation || storeReservation;

  useEffect(() => {
    api.get("/profile/vehicles").then(({ data }) => {
      if (data.vehicles && data.vehicles.length > 0) {
        setVehicles(data.vehicles);
        const defaultVehicle = data.vehicles.find((v: any) => v.isDefault) || data.vehicles[0];
        setVehiclePlate(defaultVehicle.licensePlate);
      }
    }).catch(console.error);
  }, []);

  const submitPayment = async (method: string) => {
    if (!reservation) {
      alert("Бронювання не знайдено");
      return;
    }
    
    if (!vehiclePlate.trim()) {
      alert("Будь ласка, введіть номер автомобіля для бронювання");
      return;
    }
    
    setIsLoading(true);
    try {
      await processPayment({
        reservationId: reservation.id,
        cardLast4: method === "CARD" ? card.slice(-4) : "0000",
      });
      setIsSuccess(true);
      setTimeout(() => onPaid(vehiclePlate), 2000);
    } catch (error) {
      alert("Помилка оплати. Спробуйте ще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center py-8 text-emerald-500 animate-in fade-in zoom-in duration-300">
        <CheckCircle2 className="h-16 w-16 mb-4 animate-bounce" />
        <p className="font-bold text-xl text-slate-900">Оплата пройшла успішно!</p>
        <p className="text-sm text-slate-500 mt-2">Авто: <span className="font-mono text-slate-800">{vehiclePlate}</span></p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
        <label className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Car className="h-5 w-5 text-blue-600" /> 
          Виберіть авто для паркування
        </label>
        
        {vehicles.length > 0 && (
          <div className="mb-3">
            <select 
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              onChange={(e) => setVehiclePlate(e.target.value)}
              value={vehicles.find(v => v.licensePlate === vehiclePlate) ? vehiclePlate : ""}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.licensePlate}>
                  {v.make} {v.model} ({v.licensePlate}) {v.isDefault ? "★" : ""}
                </option>
              ))}
              <option value="">Інше авто (ввести вручну)...</option>
            </select>
          </div>
        )}
        
        {(!vehicles.length || !vehicles.find(v => v.licensePlate === vehiclePlate)) && (
          <Input
            value={vehiclePlate}
            onChange={(e) => setVehiclePlate(e.target.value)}
            placeholder="Введіть номер авто (напр. BC1234AA)"
            className="text-center font-mono uppercase tracking-widest text-lg"
            maxLength={8}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="bg-black text-white hover:bg-slate-800 flex items-center justify-center gap-2 py-6" onClick={() => submitPayment("APPLE_PAY")}>
          <Smartphone className="h-5 w-5" /> Apple Pay
        </Button>
        <Button variant="outline" className="bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-900 flex items-center justify-center gap-2 py-6" onClick={() => submitPayment("GOOGLE_PAY")}>
          <Wallet className="h-5 w-5 text-blue-500" /> Google Pay
        </Button>
      </div>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
        <div className="relative flex justify-center text-xs uppercase font-medium"><span className="bg-white px-3 text-slate-400">Або новою карткою</span></div>
      </div>

      <div className="space-y-3">
        <Input 
          value={card} 
          onChange={(e) => setCard(e.target.value.replace(/\D/g, ''))} 
          placeholder="0000 0000 0000 0000" 
          maxLength={16}
          className="font-mono text-center tracking-widest"
        />
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md py-6 text-lg" 
          onClick={() => submitPayment("CARD")} 
          disabled={isLoading || card.length < 16}
        >
          <CreditCard className="h-5 w-5 mr-2" />
          Сплатити {reservation?.totalPrice} грн
        </Button>
      </div>
    </div>
  );
}