import { Car, Lock, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/utils/classNames";
import type { ParkingSpot, SpotStatus } from "@/types/parking.types";

const statusStyles: Record<SpotStatus, { container: string; icon: any; label: string }> = {
  FREE: { 
    container: "bg-emerald-500/10 border-emerald-500/50 hover:bg-emerald-500/20 text-emerald-400", 
    icon: null, 
    label: "Вільне" 
  },
  LOCKED: { 
    container: "bg-amber-500/20 border-amber-500/50 text-amber-400", 
    icon: Lock, 
    label: "Очікує" 
  },
  RESERVED: { 
    container: "bg-blue-600/30 border-blue-500/50 text-blue-100", 
    icon: Car, 
    label: "Зайнято" 
  },
  MAINTENANCE: { 
    container: "bg-rose-500/20 border-rose-500/50 text-rose-400", 
    icon: AlertTriangle, 
    label: "Сервіс" 
  },
};

export function SpotItem({
  spot,
  onSelect,
  position = "top",
}: {
  spot: ParkingSpot & { licensePlate?: string | null };
  onSelect: (spot: ParkingSpot) => void;
  position?: "top" | "bottom";
}) {
  const isFree = spot.status === "FREE";
  const style = statusStyles[spot.status];
  const Icon = style.icon;

  return (
    <button
      className={cn(
        "flex w-20 md:w-24 h-32 md:h-40 flex-col items-center justify-between py-3 md:py-4 rounded-lg border-2 transition-all relative group shadow-sm",
        style.container,
        isFree ? "cursor-pointer scale-100 hover:scale-105 hover:shadow-xl" : "cursor-not-allowed",
        position === "top" ? "border-b-[6px] md:border-b-8" : "border-t-[6px] md:border-t-8"
      )}
      disabled={!isFree}
      onClick={() => onSelect(spot)}
    >
      {/* Spot Number */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] font-black opacity-40 tracking-tighter">
        #{spot.number}
      </div>

      {/* Status Label */}
      <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest opacity-70">
        {style.label}
      </span>

      {/* Main Content (Car or Icon) */}
      <div className="flex-1 flex items-center justify-center w-full px-2">
        {spot.status === "RESERVED" ? (
          <div className="relative animate-in fade-in zoom-in duration-500">
            <Car className="h-10 w-10 md:h-14 md:w-14 fill-current opacity-90" />
            <ShieldCheck className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 text-emerald-400 fill-slate-900" />
          </div>
        ) : Icon ? (
          <Icon className="h-8 w-8 md:h-10 md:w-10 opacity-30" />
        ) : (
          <div className="h-12 md:h-16 w-1 w-full border-2 border-dashed border-white/10 rounded flex items-center justify-center">
             <span className="text-xl md:text-2xl font-black opacity-10">{spot.number}</span>
          </div>
        )}
      </div>

      {/* License Plate or Spot ID */}
      <div className="w-full px-1">
        {spot.licensePlate || spot.status === "RESERVED" ? (
          <div className="bg-white text-slate-900 rounded border border-slate-400 shadow-sm py-0.5 md:py-1 px-1 md:px-1.5 flex flex-col items-center leading-none">
            <div className="flex items-center gap-0.5 mb-0.5">
               <div className="w-1 h-2 md:h-3 bg-blue-700 rounded-sm" />
               <span className="text-[6px] md:text-[7px] font-bold text-blue-700">UA</span>
            </div>
            <span className="text-[8px] md:text-[10px] font-mono font-black tracking-tighter whitespace-nowrap">
              {spot.licensePlate || `AA${spot.number.replace(/\D/g, '').padStart(4, '0')}BC`}
            </span>
          </div>
        ) : (
          <div className="h-5 md:h-6 flex items-center justify-center">
            <span className="text-base md:text-lg font-black opacity-30">{spot.number}</span>
          </div>
        )}
      </div>

      {/* Parking Lines (Decorative) */}
      <div className="absolute -left-1.5 md:-left-2 top-0 bottom-0 w-0.5 md:w-1 bg-white/10 rounded-full" />
      <div className="absolute -right-1.5 md:-right-2 top-0 bottom-0 w-0.5 md:w-1 bg-white/10 rounded-full" />
    </button>
  );
}