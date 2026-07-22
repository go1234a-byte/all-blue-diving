import { createContext, useContext, useState, type ReactNode } from "react";

export type AdminPeriod = "today" | "week" | "month" | "year" | "custom";

interface AdminPeriodContextValue {
  period: AdminPeriod;
  setPeriod: (period: AdminPeriod) => void;
}

const AdminPeriodContext = createContext<AdminPeriodContextValue | undefined>(undefined);

export function AdminPeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<AdminPeriod>("month");
  return (
    <AdminPeriodContext.Provider value={{ period, setPeriod }}>{children}</AdminPeriodContext.Provider>
  );
}

export function useAdminPeriod(): AdminPeriodContextValue {
  const ctx = useContext(AdminPeriodContext);
  if (!ctx) throw new Error("useAdminPeriod must be used within AdminPeriodProvider");
  return ctx;
}
