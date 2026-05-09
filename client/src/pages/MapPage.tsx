import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MapContainer } from "@/features/ParkingMap/MapContainer";
import { ReserveModal } from "@/features/Reservation/ReserveModal";
import { useSocket } from "@/hooks/useSocket";
import { useParkingStore } from "@/store/parking.store";

export function MapPage() {
  const { spots, selectedSpot, setSelectedSpot, fetchSpots } = useParkingStore();
  useSocket();

  useEffect(() => {
    void fetchSpots();
  }, [fetchSpots]);

  return (
    <MainLayout>
      <MapContainer spots={spots} onSelectSpot={setSelectedSpot} />
      <ReserveModal spot={selectedSpot} onClose={() => setSelectedSpot(null)} />
    </MainLayout>
  );
}
