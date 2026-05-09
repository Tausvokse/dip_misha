import { blockSpotMaintenance } from "@/api/admin.api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { ParkingSpot } from "@/types/parking.types";

export function SpotManager({
  spots,
  onChanged,
}: {
  spots: ParkingSpot[];
  onChanged: () => Promise<void>;
}) {
  async function toggleMaintenance(spot: ParkingSpot) {
    await blockSpotMaintenance(spot.number, spot.status !== "MAINTENANCE");
    await onChanged();
  }

  return (
    <div className="rounded-xl bg-slate-900 p-5">
      <h2 className="mb-4 text-lg font-bold text-white">Керування місцями</h2>
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
        {spots.slice(0, 24).map((spot) => {
          const isBusy = spot.status === "RESERVED" || spot.status === "LOCKED" || spot.status === "PENDING_PAYMENT";
          
          return (
            <div key={spot.id} className="rounded-lg bg-slate-950 p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-bold text-white">{spot.number}</span>
                <Badge status={spot.status}>{spot.status}</Badge>
              </div>
              <Button 
                variant="outline" 
                className="h-8 w-full" 
                onClick={() => toggleMaintenance(spot)}
                disabled={isBusy}
                title={isBusy ? "Місце зайняте, неможливо відправити на ремонт" : ""}
              >
                {spot.status === "MAINTENANCE" ? "Зняти ремонт" : "На ремонт"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}