import { CircleCheck, Clock, ParkingSquare, Wrench } from "lucide-react";
import type { AdminStatsResponse } from "@/types/api.types";
import { formatCurrency } from "@/utils/formatCurrency";

export function StatCards({ stats }: { stats: AdminStatsResponse | null }) {
  const cards = [
    { label: "Усього місць", value: stats?.spots.total ?? 0, icon: ParkingSquare },
    { label: "Вільно", value: stats?.spots.FREE ?? 0, icon: CircleCheck },
    { label: "Очікують оплату", value: stats?.spots.LOCKED ?? 0, icon: Clock },
    { label: "Ремонт", value: stats?.spots.MAINTENANCE ?? 0, icon: Wrench },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl bg-slate-900 p-5">
          <card.icon className="mb-4 h-5 w-5 text-blue-300" />
          <p className="text-sm text-slate-400">{card.label}</p>
          <p className="mt-1 text-3xl font-bold text-white">{card.value}</p>
        </div>
      ))}
      <div className="rounded-xl bg-blue-600 p-5 md:col-span-4">
        <p className="text-sm text-blue-100">Виручка за 7 днів</p>
        <p className="mt-1 text-3xl font-bold text-white">{formatCurrency(stats?.revenue.last7Days ?? 0)}</p>
      </div>
    </div>
  );
}
