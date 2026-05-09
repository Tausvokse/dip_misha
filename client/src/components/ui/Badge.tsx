import type { ReactNode } from "react";
import { cn } from "@/utils/classNames";
import type { SpotStatus } from "@/types/parking.types";

const statusClass: Record<SpotStatus, string> = {
  FREE: "bg-emerald-100 text-emerald-700",
  LOCKED: "bg-amber-100 text-amber-700",
  RESERVED: "bg-red-100 text-red-700",
  MAINTENANCE: "bg-slate-200 text-slate-700",
};

export function Badge({
  children,
  status,
  className,
}: {
  children: ReactNode;
  status?: SpotStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        status ? statusClass[status] : "bg-blue-100 text-blue-700",
        className,
      )}
    >
      {children}
    </span>
  );
}
