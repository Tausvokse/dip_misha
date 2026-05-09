import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useParkingMap } from "@/hooks/useParkingMap";
import type { ParkingSpot } from "@/types/parking.types";
import { MapLegend } from "./MapLegend";
import { SpotGrid } from "./SpotGrid";

export function MapContainer({
  spots,
  onSelectSpot,
}: {
  spots: ParkingSpot[];
  onSelectSpot: (spot: ParkingSpot) => void;
}) {
  const { zoom, zoomIn, zoomOut, resetZoom } = useParkingMap();

  return (
    <section className="rounded-xl bg-white p-4 md:p-6 shadow-soft flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Карта паркінгу</h1>
          <p className="mt-1 text-sm text-slate-500">Оберіть вільне місце для бронювання.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={zoomOut} className="h-9 w-9 px-0">
            <Minus className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={resetZoom} className="h-9 w-9 px-0">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={zoomIn} className="h-9 w-9 px-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <MapLegend />
      <div className="mt-6 overflow-auto rounded-xl bg-slate-900 p-4 md:p-6 flex-1 min-h-0">
        <div 
          className="flex items-center justify-center min-w-max min-h-max pb-10"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          <SpotGrid spots={spots} onSelect={onSelectSpot} />
        </div>
      </div>
    </section>
  );
}
