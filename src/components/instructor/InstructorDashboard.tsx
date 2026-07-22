import { CalendarClock, ShieldAlert, Star, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateKR } from "@/lib/dates";
import { UnderMinDecisionPanel } from "./UnderMinDecisionPanel";

interface InstructorDashboardProps {
  instructorId: string;
}

export function InstructorDashboard({ instructorId }: InstructorDashboardProps) {
  const { getInstructorById, tours, bookings } = useAppData();
  const instructor = getInstructorById(instructorId);
  const myTours = tours.filter((t) => t.instructorId === instructorId);
  const myBookingsCount = bookings.filter((b) => myTours.some((t) => t.id === b.tourId)).length;

  if (!instructor) return null;

  return (
    <div className="space-y-4">
      <UnderMinDecisionPanel instructorId={instructorId} />

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="space-y-1 p-4 text-center">
            <p className="text-xs text-muted-foreground">등록 투어</p>
            <p className="text-2xl font-bold text-primary">{myTours.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4 text-center">
            <p className="text-xs text-muted-foreground">누적 예약</p>
            <p className="text-2xl font-bold text-primary">{myBookingsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4 text-center">
            <p className="text-xs text-muted-foreground">평균 평점</p>
            <p className="text-2xl font-bold text-primary">{instructor.rating.toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">신뢰도 스코어카드</h3>
            {instructor.verified && <Badge className="bg-accent text-accent-foreground">플랫폼 인증강사</Badge>}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              완료율 {instructor.completionRate}%
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="h-4 w-4" />
              만족도 {instructor.rating.toFixed(1)} / 5.0
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-medium text-warning-foreground">
            <ShieldAlert className="h-3.5 w-3.5" />
            패널티 누적 이력: {instructor.penaltyCount}회
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">내 투어 목록</h3>
        {myTours.map((tour) => (
          <Card key={tour.id}>
            <CardContent className="flex items-center gap-3 p-3">
              <img
                src={tour.mainImageUrl}
                alt={tour.title}
                crossOrigin="anonymous"
                className="h-12 w-12 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-foreground">{tour.title}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarClock className="h-3 w-3" />
                  모집마감 {formatDateKR(tour.recruitmentDeadline)}
                </p>
              </div>
              <Badge variant={tour.status === "open" ? "default" : "secondary"}>
                {tour.status === "open" ? "모집중" : "마감"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
