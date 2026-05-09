import type { ParkingSpot } from "@/types/parking.types";
import { SpotItem } from "./SpotItem";

export function SpotGrid({
  spots,
  onSelect,
}: {
  spots: ParkingSpot[];
  onSelect: (spot: ParkingSpot) => void;
}) {
  // Break 48 spots into 4 rows of 12
  const row1 = spots.slice(0, 12);
  const row2 = spots.slice(12, 24);
  const row3 = spots.slice(24, 36);
  const row4 = spots.slice(36, 48);

  const Street = ({ topRow, bottomRow, label }: { topRow: ParkingSpot[], bottomRow: ParkingSpot[], label: string }) => (
    <div className="flex flex-col gap-4 md:gap-6 relative">
      <div className="absolute -left-6 md:-left-12 top-1/2 -translate-y-1/2 -rotate-90 text-sm md:text-xl font-black text-slate-600 opacity-50 uppercase tracking-[0.3em] whitespace-nowrap">
        {label}
      </div>
      
      {/* Top Row */}
      <div className="flex gap-2 md:gap-3 relative z-10 px-2 md:px-4">
        {topRow.map((spot) => (
          <div key={spot.id} className="relative group shrink-0">
            <SpotItem spot={spot} onSelect={onSelect} position="top" />
          </div>
        ))}
      </div>

      {/* Road */}
      <div className="h-12 md:h-20 bg-slate-700/50 rounded-xl relative flex items-center border-y-2 border-dashed border-slate-600/30">
        <div className="w-full h-1 flex justify-around items-center px-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-4 md:w-6 h-0.5 md:h-1 bg-yellow-400/40 rounded-full shrink-0" />
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="flex gap-2 md:gap-3 relative z-10 px-2 md:px-4">
        {bottomRow.map((spot) => (
          <div key={spot.id} className="relative group shrink-0">
            <SpotItem spot={spot} onSelect={onSelect} position="bottom" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 md:gap-16 w-max p-6 md:p-12 bg-slate-800 rounded-[24px] md:rounded-[40px] border-4 md:border-8 border-slate-700 shadow-2xl relative overflow-hidden mx-auto">
      <Street topRow={row1} bottomRow={row2} label="Сектор A" />
      
      {/* Central separator */}
      <div className="h-2 md:h-4 w-full bg-slate-700/30 rounded-full" />
      
      <Street topRow={row3} bottomRow={row4} label="Сектор B" />
      
      {/* Decorative marks */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 w-8 h-8 md:w-16 md:h-16 border-t-4 border-l-4 border-white/5 rounded-tl-2xl" />
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 w-8 h-8 md:w-16 md:h-16 border-b-4 border-r-4 border-white/5 rounded-br-2xl" />
    </div>
  );
}
