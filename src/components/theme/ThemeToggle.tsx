import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * 마이페이지 공용 — 라이트/다크 모드 전환 토글. PushNotificationToggle과 동일한
 * 카드형 레이아웃을 재사용해 마이페이지 내 다른 설정 항목과 톤을 맞춘다.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
      <div className="flex items-start gap-2.5">
        {isDark ? (
          <Moon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        ) : (
          <Sun className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        )}
        <div className="space-y-0.5">
          <Label className="text-sm font-medium text-foreground">다크 모드</Label>
          <p className="break-keep text-xs text-muted-foreground">
            {isDark ? "어두운 화면으로 보고 있습니다." : "밝은 화면으로 보고 있습니다."}
          </p>
        </div>
      </div>
      <Switch checked={isDark} onCheckedChange={toggleTheme} aria-label="다크 모드 전환" />
    </div>
  );
}
