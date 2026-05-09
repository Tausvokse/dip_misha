import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="mt-3 text-slate-400">Сторінку не знайдено.</p>
      <Link className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold" to="/">
        На головну
      </Link>
    </main>
  );
}
