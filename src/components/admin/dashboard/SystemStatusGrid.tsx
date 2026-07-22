import { Bell, CreditCard, Database, Mail, ServerCog, ShieldCheck, HardDrive } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SystemStatus = "정상" | "주의" | "오류";

interface SystemService {
  name: string;
  icon: LucideIcon;
  status: SystemStatus;
}

const SERVICES: SystemService[] = [
  { name: "Authentication", icon: ShieldCheck, status: "정상" },
  { name: "Firestore", icon: Database, status: "정상" },
  { name: "Storage", icon: HardDrive, status: "정상" },
  { name: "Cloud Functions", icon: ServerCog, status: "정상" },
  { name: "Notification", icon: Bell, status: "정상" },
  { name: "Payment", icon: CreditCard, status: "정상" },
  { name: "Email", icon: Mail, status: "정상" },
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

/** 시스템 상태 — 각 서비스의 정상/주의/오류 상태를 색상으로 표시. */
export function SystemStatusGrid() {
  return (
    <Card className="accent-top-ocean">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">시스템 상태</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.name}
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
