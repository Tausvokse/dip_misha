import { useEffect } from "react";
import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { MapPage } from "@/pages/MapPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ReservationsPage } from "@/pages/ReservationsPage";
import { PaymentsPage } from "@/pages/PaymentsPage";
import { useAuthStore } from "@/store/auth.store";
import { useParkingStore } from "@/store/parking.store";

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, token, isLoading } = useAuthStore();
  const fetchActiveReservation = useParkingStore((state) => state.fetchActiveReservation);

  useEffect(() => {
    if (user && token) {
      fetchActiveReservation();
    }
  }, [user, token, fetchActiveReservation]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-white text-xl font-bold animate-pulse">Завантаження...</div>
      </div>
    );
  }

  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AdminRoute({ children }: { children: ReactElement }) {
  const user = useAuthStore((state) => state.user);

  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reservations"
        element={
          <ProtectedRoute>
            <ReservationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <PaymentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}