import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardMetric {
  label: string;
  value: string;
}

interface KpiCardProps {
  title: string;
  icon: LucideIcon;
  primaryValue: string;
  metrics: KpiCardMetric[];
  to?: string;
  tone?: "default" | "warning" | "destructive";
  /** 카드 하단에 누구인지(이름 등) 요약해서 보여주고 싶을 때 사용. 예: 오늘 가입자 이름 목록. */
  footerNote?: string;
}

const TONE_CLASSES: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "text-primary",
  warning: "text-warning",
  destructive: "text-destructive",
};

/** 관리자 Dashboard 상단 KPI 카드 — 숫자가 먼저 보이도록 구성, 클릭 시 상세 페이지 이동. */
export function KpiCard({ title, icon: Icon, primaryValue, metrics, to, tone = "default", footerNote }: KpiCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className={cn(
        "accent-top-ocean overflow-hidden transition-shadow",
        to && "cursor-pointer hover:shadow-ocean",
      )}
      onClick={to ? () => navigate(to) : undefined}
      role={to ? "button" : undefined}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <Icon className={cn("h-4 w-4", TONE_CLASSES[tone])} />
        </div>
        <p className={cn("text-2xl font-bold", TONE_CLASSES[tone])}>{primaryValue}</p>
        <div className="space-y-0.5">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{m.label}</span>
              <span className="font-semibold text-foreground">{m.value}</span>
            </div>
          ))}
        </div>
        {footerNote && (
          <p className="line-clamp-2 border-t border-border/60 pt-1.5 text-[10px] leading-snug text-muted-foreground">
            {footerNote}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
