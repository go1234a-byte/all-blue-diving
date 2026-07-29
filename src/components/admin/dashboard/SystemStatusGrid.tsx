import { useEffect, useState } from "react";
import { Bell, CreditCard, Database, Mail, ServerCog, ShieldCheck, HardDrive } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type SystemStatus = "정상" | "주의" | "오류";

interface SystemService {
  name: string;
  icon: LucideIcon;
  status: SystemStatus;
  note?: string;
}

// Notification(실 푸시)/Payment(실 PG 연동)/Email(발송)은 아직 실제로 구현되어 있지 않아서,
// "정상"이라고 표시하는 건 사실과 다르다 — 실제로 미구현 상태임을 "주의"로 정직하게 표시한다.
const STATIC_SERVICES: SystemService[] = [
  { name: "Notification", icon: Bell, status: "주의", note: "실 푸시 미연동(VAPID 키 없음)" },
  { name: "Payment", icon: CreditCard, status: "주의", note: "실 PG 미연동(결제 모의 처리 중)" },
  { name: "Email", icon: Mail, status: "주의", note: "이메일 발송 기능 없음" },
];

const STATUS_DOT: Record<SystemStatus, string> = {
  정상: "bg-success",
  주의: "bg-warning",
  오류: "bg-destructive",
};

const STATUS_TEXT: Record<SystemStatus, string> = {
  정상: "text-success",
  주의: "text-warning",
  오류: "text-destructive",
};

/** 시스템 상태 — Auth/DB/Storage는 실제로 가볍게 핑을 날려서 확인하고, 나머지는 실제 구현 여부에 맞게 표시한다. */
export function SystemStatusGrid() {
  const [liveServices, setLiveServices] = useState<SystemService[]>([
    { name: "Authentication", icon: ShieldCheck, status: "정상" },
    { name: "Database", icon: Database, status: "정상" },
    { name: "Storage", icon: HardDrive, status: "정상" },
    { name: "Functions", icon: ServerCog, status: "정상" },
  ]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [authRes, dbRes, storageRes] = await Promise.allSettled([
        supabase.auth.getSession(),
        supabase.from("policies").select("id").limit(1),
        supabase.storage.from("uploads").list("", { limit: 1 }),
      ]);
      if (!active) return;
      setLiveServices((prev) =>
        prev.map((service) => {
          if (service.name === "Authentication") {
            return { ...service, status: authRes.status === "fulfilled" ? "정상" : "오류" };
          }
          if (service.name === "Database") {
            const ok = dbRes.status === "fulfilled" && !dbRes.value.error;
            return { ...service, status: ok ? "정상" : "오류" };
          }
          if (service.name === "Storage") {
            const ok = storageRes.status === "fulfilled" && !storageRes.value.error;
            return { ...service, status: ok ? "정상" : "오류" };
          }
          return service;
        }),
      );
    })();
    return () => {
      active = false;
    };
  }, []);

  const services = [...liveServices, ...STATIC_SERVICES];

  return (
    <Card className="accent-top-ocean">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">시스템 상태</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.name}
                title={service.note}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-center"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-[11px] font-medium text-foreground">{service.name}</span>
                <span className={cn("flex items-center gap-1 text-[10px] font-semibold", STATUS_TEXT[service.status])}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[service.status])} />
                  {service.status}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
