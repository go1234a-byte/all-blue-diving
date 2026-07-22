import { Globe, Instagram, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Center } from "@/types";

interface TourCenterCardProps {
  center: Center;
}

/**
 * 투어 상세페이지 - 투어가 연결된 이용센터(Center) 정보 카드.
 * 센터명/주소/홈페이지/Instagram/Google Map 버튼과 특징 태그를 보여준다.
 * 연락처는 관리자 전용이므로 이 카드에는 노출하지 않는다.
 */
export function TourCenterCard({ center }: TourCenterCardProps) {
  return (
    <Card className="border-primary/20">
      <CardContent className="space-y-3 p-4">
        <h3 className="text-sm font-semibold text-foreground">이용센터</h3>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{center.name}</p>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {center.address}
          </p>
        </div>

        {center.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {center.features.map((feature) => (
              <Badge key={feature} variant="secondary" className="text-[10px]">
                {feature}
              </Badge>
            ))}
          </div>
        )}

        {(center.homepage || center.instagram || center.googleMap) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {center.homepage && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                <a href={center.homepage} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-3.5 w-3.5" />
                  홈페이지
                </a>
              </Button>
            )}
            {center.instagram && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                <a href={center.instagram} target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-3.5 w-3.5" />
                  Instagram
                </a>
              </Button>
            )}
            {center.googleMap && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                <a href={center.googleMap} target="_blank" rel="noopener noreferrer">
                  <MapPin className="h-3.5 w-3.5" />
                  Google Map 보기
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
