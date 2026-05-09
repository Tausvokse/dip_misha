import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AdminStatsResponse } from "@/types/api.types";

export function OccupancyChart({ stats }: { stats: AdminStatsResponse | null }) {
  return (
    <div className="rounded-xl bg-slate-900 p-5">
      <h2 className="mb-4 text-lg font-bold text-white">Активність за тиждень</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats?.chart ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip />
            <Bar dataKey="reservations" fill="#60a5fa" radius={6} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
