import { Link } from "react-router-dom";
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
 * 네 항목 모두 클릭하면 관련 상세 화면으로 이동한다.
 */
export function OperationalHighlightsPanel() {
  const { instructors, tours, bookings, diverProfiles, instructorProfiles } = useAppData();

  const lowActivity = computeLowActivityInstructors(instructors, tours);
  const popularCountries = computePopularCountries(bookings, tours);
  const recentTours = computeRecentTours(tours);
  const recentMembers = computeRecentMembers(diverProfiles, instructorProfiles);

  // UserTable.tsx의 detailLinkFor와 동일한 규칙: 강사는 profile.id와 instructors.id가
  // 별개 PK라서, 프로필 상세로 가려면 instructors 테이블에서 매칭되는 id를 찾아야 한다.
  const memberDetailLink = (member: (typeof recentMembers)[number]) => {
    if (member.role === "instructor") {
      const instructor = instructors.find((i) => i.profileId === member.id);
      return instructor ? `/instructor/${instructor.id}/profile` : undefined;
    }
    return `/admin/users/${member.id}`;
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="accent-top-ocean">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground">활동률 낮은 강사</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {lowActivity.map(({ instructor, tourCount }) => (
            <Link
              key={instructor.id}
              to={`/instructor/${instructor.id}/profile`}
              className="flex items-center justify-between text-xs transition-colors hover:text-primary"
            >
              <span className="text-foreground">{instructor.name}</span>
              <span className="text-muted-foreground">투어 {tourCount}개</span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="accent-top-ocean">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground">인기 국가 (예약률)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {popularCountries.map((c) => (
            <Link
              key={c.country}
              to={`/search?q=${encodeURIComponent(c.country)}`}
              className="flex items-center justify-between text-xs transition-colors hover:text-primary"
            >
              <span className="text-foreground">{c.country}</span>
              <Badge variant="secondary" className="text-[10px]">{c.count}건</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="accent-top-ocean">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground">최근 생성된 신규 투어</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {recentTours.map((t) => (
            <Link
              key={t.id}
              to={`/tour/${t.id}`}
              className="block truncate text-xs text-foreground transition-colors hover:text-primary"
            >
              {t.title}
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="accent-top-ocean">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground">최근 가입한 신규 회원</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {recentMembers.map((m) => {
            const detailLink = memberDetailLink(m);
            const row = (
              <>
                <span className="text-foreground">{m.name}</span>
                <span className="text-muted-foreground">{formatDateKR(m.createdAt)}</span>
              </>
            );
            return detailLink ? (
              <Link
                key={m.id}
                to={detailLink}
                className="flex items-center justify-between text-xs transition-colors hover:text-primary"
              >
                {row}
              </Link>
            ) : (
              <div key={m.id} className="flex items-center justify-between text-xs">
                {row}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
