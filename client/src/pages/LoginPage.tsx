import { FormEvent, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/auth.store";

export function LoginPage() {
  const [email, setEmail] = useState("user@parking.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const { login, user, isLoading } = useAuthStore();

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch {
      setError("Невірний email або пароль");
    }
  }

  function handleGoogleAuth() {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Вхід у ParkAuto</h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">Увійдіть у свій акаунт для продовження</p>
        </div>
        
        <div className="space-y-4">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full flex items-center justify-center gap-3 py-6 border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition-all" 
            onClick={handleGoogleAuth}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="font-semibold text-md">Продовжити з Google</span>
          </Button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider"><span className="bg-white px-3 text-slate-400">Або через Email</span></div>
          </div>

          <Input 
            value={email} 
            onChange={(event) => setEmail(event.target.value)} 
            placeholder="Email адреса" 
            className="py-6 text-md"
          />
          <Input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Пароль"
            type="password"
            className="py-6 text-md"
          />
          
          {error ? <p className="text-sm font-semibold text-red-500 bg-red-50 p-3 rounded-lg">{error}</p> : null}
          
          <Button className="w-full py-6 text-lg font-bold shadow-md bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            {isLoading ? "Входимо..." : "Увійти"}
          </Button>
          
          <div className="mt-6 text-center text-sm font-medium text-slate-500">
            Немає акаунту? <Link to="/register" className="text-blue-600 font-bold hover:underline">Зареєструватися</Link>
          </div>
        </div>
      </form>
    </main>
  );
}