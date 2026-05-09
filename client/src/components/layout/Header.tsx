import { LogOut, ParkingCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth.store";

export function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <Link to="/" className="flex items-center gap-2 text-slate-950">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
          <ParkingCircle className="h-5 w-5" />
        </span>
        <span className="text-lg font-bold">ParkAuto</span>
      </Link>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">{user?.email ?? "Гість"}</span>
        {user ? (
          <Button variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Вийти
          </Button>
        ) : null}
      </div>
    </header>
  );
}
