import { NavLink } from "react-router-dom";
import { Waves, Trophy, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/game", label: "플레이", icon: Waves, end: true },
  { to: "/game/leaderboard", label: "랭킹", icon: Trophy, end: false },
  { to: "/game/shop", label: "보관함", icon: ShoppingBag, end: false },
];

export function GameBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] border-t border-border bg-card/95 backdrop-blur">
      <div className="grid grid-cols-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
