import { BarChart3, Calendar, CreditCard, ParkingCircle, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ActiveTimerInfo } from "@/features/Reservation/ActiveTimerInfo";
import { useAuthStore } from "@/store/auth.store";
import { useParkingStore } from "@/store/parking.store";
import { cn } from "@/utils/classNames";
import { useMemo } from "react";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-[10px] md:text-sm font-bold uppercase tracking-widest transition-all duration-200",
    "md:w-full md:justify-start justify-center flex-col md:flex-row",
    isActive 
      ? "bg-[#111827] text-white shadow-md scale-105 md:scale-100" 
      : "text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]"
  );

export function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const activeReservations = useParkingStore((state) => state.activeReservations);

  // For mobile Option A: Find the reservation that expires the soonest
  const closestReservation = useMemo(() => {
    if (!activeReservations.length) return null;
    return activeReservations.reduce((closest, current) => {
      const getTargetTime = (r: any) => {
        const timeStr = r.status === "PENDING_PAYMENT" ? r.lockExpiresAt : r.endTime;
        return timeStr ? new Date(timeStr).getTime() : Infinity;
      };
      return getTargetTime(current) < getTargetTime(closest) ? current : closest;
    });
  }, [activeReservations]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-80 flex-col justify-between border-r-2 border-[#E5E7EB] bg-white p-6 shrink-0 shadow-sm relative z-20 h-screen overflow-y-auto">
        <nav className="flex flex-col gap-2">
          <NavLink to="/" className={linkClass}>
            <ParkingCircle className="h-5 w-5 md:h-4 md:w-4 shrink-0" />
            <span className="hidden md:inline">Карта паркінгу</span>
          </NavLink>
          <NavLink to="/reservations" className={linkClass}>
            <Calendar className="h-5 w-5 md:h-4 md:w-4 shrink-0" />
            <span className="hidden md:inline">Мої бронювання</span>
          </NavLink>
          <NavLink to="/payments" className={linkClass}>
            <CreditCard className="h-5 w-5 md:h-4 md:w-4 shrink-0" />
            <span className="hidden md:inline">Платежі</span>
          </NavLink>
          {user?.role === "ADMIN" ? (
            <NavLink to="/admin" className={linkClass}>
              <BarChart3 className="h-5 w-5 md:h-4 md:w-4 shrink-0" />
              <span className="hidden md:inline">Адмінка</span>
            </NavLink>
          ) : null}
          <NavLink to="/profile" className={linkClass}>
            <User className="h-5 w-5 md:h-4 md:w-4 shrink-0" />
            <span className="hidden md:inline">Профіль</span>
          </NavLink>
        </nav>
        <div className="mt-8 flex flex-col gap-4">
          {activeReservations.length > 0 ? (
            activeReservations.map(res => (
              <ActiveTimerInfo key={res.id} reservation={res} />
            ))
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-[#F9FAFB] p-5 text-sm text-[#9CA3AF] text-center font-medium">
              Активної броні немає
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#E5E7EB] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 flex items-center justify-around px-2 py-2 pb-safe">
        <NavLink to="/" className={linkClass}>
          <ParkingCircle className="h-6 w-6 shrink-0" />
        </NavLink>
        <NavLink to="/reservations" className={linkClass}>
          <Calendar className="h-6 w-6 shrink-0" />
        </NavLink>
        
        <div className="flex-1 max-w-[80px] -mt-10 px-2">
           {closestReservation && (
             <ActiveTimerInfo mobile reservation={closestReservation} />
           )}
        </div>
        
        <NavLink to="/payments" className={linkClass}>
          <CreditCard className="h-6 w-6 shrink-0" />
        </NavLink>
        <NavLink to="/profile" className={linkClass}>
          <User className="h-6 w-6 shrink-0" />
        </NavLink>
      </nav>
    </>
  );
}