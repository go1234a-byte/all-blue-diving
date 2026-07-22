import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/contexts/AppDataContext";
import {
  computeLowActivityInstructors,
  computePopularCountries,
  computeRecentMembers,
  computeRecentTours,
} from "@/lib/adminAnalytics";
import { formatDateKR } from "@/lib/dates";

/**
 * ALL BLUE 운영 플랫폼 특화 하이라이트:
 * 활동률 낮은 강사 / 예약률 높은 인기 국가 / 최근 생성된 신규 투어 / 최근 가입한 신규 회원.
 */
export function OperationalHighlightsPanel() {
  const { instructors, tours, bookings, diverProfiles, instructorProfiles } = useAppData();

  const lowActivity = computeLowActivityInstructors(instructors, tours);
  const popularCountries = computePopularCountries(bookings, tours);
  const recentTours = computeRecentTours(tours);
  const recentMembers = computeRecentMembers(diverProfiles, instructorProfiles);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="accent-top-ocean">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground">활동률 낮은 강사</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {lowActivity.map(({ instructor, tourCount }) => (
            <div key={instructor.id} className="flex items-center justify-between text-xs">
              <span className="text-foreground">{instructor.name}</span>
              <span className="text-muted-foreground">투어 {tourCount}개</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="accent-top-ocean">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground">인기 국가 (예약률)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {popularCountries.map((c) => (
            <div key={c.country} className="flex items-center justify-between text-xs">
              <span className="text-foreground">{c.country}</span>
              <Badge variant="secondary" className="text-[10px]">{c.count}건</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="accent-top-ocean">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground">최근 생성된 신규 투어</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {recentTours.map((t) => (
            <p key={t.id} className="truncate text-xs text-foreground">{t.title}</p>
          ))}
        </CardContent>
      </Card>

      <Card className="accent-top-ocean">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground">최근 가입한 신규 회원</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {recentMembers.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs">
              <span className="text-foreground">{m.name}</span>
              <span className="text-muted-foreground">{formatDateKR(m.createdAt)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
