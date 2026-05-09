import type { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111827] flex flex-col font-sans selection:bg-[#111827] selection:text-white pb-20 md:pb-0">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-auto p-4 md:p-8 bg-[#F8F9FA]">
          {children}
        </main>
      </div>
    </div>
  );
}
