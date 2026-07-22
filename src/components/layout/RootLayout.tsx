import { Outlet } from "react-router-dom";
import { MasterRoleToolbar } from "@/components/MasterRoleToolbar";

export function RootLayout() {
  return (
    <div className="min-h-full">
      <Outlet />
      {import.meta.env.DEV && <MasterRoleToolbar />}
    </div>
  );
}
