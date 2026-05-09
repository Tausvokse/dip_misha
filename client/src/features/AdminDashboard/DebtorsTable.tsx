import type { Reservation } from "@/types/parking.types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

export function DebtorsTable({ reservations }: { reservations: Reservation[] }) {
  const rows = reservations.filter((reservation) => reservation.status === "PENDING_PAYMENT");

  return (
    <div className="rounded-xl bg-slate-900 p-5">
      <h2 className="mb-4 text-lg font-bold text-white">Неоплачені броні</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="py-2">Користувач</th>
              <th>Місце</th>
              <th>Сума</th>
              <th>Створено</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((reservation) => (
              <tr key={reservation.id} className="border-t border-slate-800 text-slate-200">
                <td className="py-3">{reservation.user?.email ?? reservation.userId}</td>
                <td>{reservation.spot?.number ?? reservation.spotId}</td>
                <td>{formatCurrency(reservation.totalPrice)}</td>
                <td>{formatDate(reservation.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
