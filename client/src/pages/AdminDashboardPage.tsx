import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { getAdminReservations, getAdminSpots, getStats } from "@/api/admin.api";
import type { AdminStatsResponse } from "@/types/api.types";
import type { ParkingSpot, Reservation } from "@/types/parking.types";
import { StatCards } from "@/features/AdminDashboard/StatCards";
import { OccupancyChart } from "@/features/AdminDashboard/OccupancyChart";
import { DebtorsTable } from "@/features/AdminDashboard/DebtorsTable";
import { SpotManager } from "@/features/AdminDashboard/SpotManager";

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);

  async function load() {
    const [statsResponse, reservationsResponse, spotsResponse] = await Promise.all([
      getStats(),
      getAdminReservations(),
      getAdminSpots(),
    ]);

    setStats(statsResponse.data);
    setReservations(reservationsResponse.data.reservations);
    setSpots(spotsResponse.data.spots);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Адмін-панель</h1>
        <p className="mt-2 text-slate-400">Статистика, борги та керування місцями.</p>
      </div>
      <div className="grid gap-6">
        <StatCards stats={stats} />
        <OccupancyChart stats={stats} />
        <DebtorsTable reservations={reservations} />
        <SpotManager spots={spots} onChanged={load} />
      </div>
    </AdminLayout>
  );
}
