import { Compass, ShieldCheck, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRole, type MasterRole } from "@/contexts/RoleContext";
import { cn } from "@/lib/utils";

const ROLE_ITEMS: { role: MasterRole; label: string; icon: typeof User; path: string }[] = [
  { role: "public", label: "일반", icon: User, path: "/" },
  { role: "instructor", label: "강사", icon: Compass, path: "/instructor" },
  { role: "admin", label: "관리자", icon: ShieldCheck, path: "/admin" },
];

export function MasterRoleToolbar() {
  const { role, setRole } = useRole();
  const navigate = useNavigate();

  const handleSelect = (item: (typeof ROLE_ITEMS)[number]) => {
    setRole(item.role);
    navigate(item.path);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2">
      <div className="rounded-full border border-sidebar-border bg-sidebar/95 p-1.5 shadow-ocean backdrop-blur">
        <div className="flex items-center gap-1">
          {ROLE_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = role === item.role;
            return (
              <button
                key={item.role}
                type="button"
                onClick={() => handleSelect(item)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground shadow-ocean-glow"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <span className="rounded-full bg-sidebar/80 px-2.5 py-1 text-[10px] text-sidebar-foreground/70 backdrop-blur">
        마스터 테스트 툴바 (QA 전용)
      </span>
    </div>
  );
}
