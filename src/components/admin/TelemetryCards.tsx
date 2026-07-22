import { Compass, MapPin, Users, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppData } from "@/contexts/AppDataContext";
import { formatKRW } from "@/lib/pricing";

export function TelemetryCards() {
  const { tours, bookings, diverProfiles, instructorProfiles } = useAppData();

  const totalRevenue = bookings.reduce((sum, b) => sum + b.platformFee, 0);
  const totalUsers = diverProfiles.length + instructorProfiles.length;

  const cards = [
    { label: "총 회원 수", value: `${totalUsers}명`, icon: Users },
    { label: "등록 투어 수", value: `${tours.length}개`, icon: MapPin },
    { label: "누적 예약 건수", value: `${bookings.length}건`, icon: Compass },
    { label: "플랫폼 수수료 매출", value: formatKRW(totalRevenue), icon: Wallet },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {card.label}
              </div>
              <p className="text-xl font-bold text-primary">{card.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
