import { Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DiveCenter } from "@/types";

interface DiveCenterCardProps {
  diveCenter: DiveCenter;
}

export function DiveCenterCard({ diveCenter }: DiveCenterCardProps) {
  return (
    <Card className="border-primary/20">
      <CardContent className="space-y-3 p-4">
        <h3 className="text-sm font-semibold text-foreground">예약된 센터 소개</h3>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{diveCenter.name}</p>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {diveCenter.address}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {diveCenter.operatingHours}
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {diveCenter.photos.map((url, i) => (
            <div key={url + i} className="h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-border">
              <img
                src={url}
                alt={`${diveCenter.name} 시설 사진 ${i + 1}`}
                crossOrigin="anonymous"
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        <div className="flex h-24 items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-secondary/50 text-xs text-muted-foreground">
          <MapPin className="h-4 w-4" />
          위치 지도 미리보기 (준비 중)
        </div>
      </CardContent>
    </Card>
  );
}
