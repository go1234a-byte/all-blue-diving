import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  CalendarCheck,
  Clock,
  Globe2,
  Languages,
  MapPin,
  MessageCircleOff,
  Star,
  TrendingDown,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BottomNav } from "@/components/layout/BottomNav";
import { VerifiedBadge } from "@/components/tour/VerifiedBadge";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateKR, formatDateRangeKR, isPastDate } from "@/lib/dates";
import { maskName } from "@/lib/masking";
import type { ChatMessage } from "@/types";

/** 응답률/응답속도 — 다이버 메시지 이후 강사가 실제로 답장했는지, 얼마나 빨리 답했는지 채팅 로그로부터 계산. */
function computeResponseStats(messages: ChatMessage[], instructorProfileId: string) {
  const byTour = new Map<string, ChatMessage[]>();
  messages.forEach((m) => {
    if (!byTour.has(m.tourId)) byTour.set(m.tourId, []);
    byTour.get(m.tourId)!.push(m);
  });

  let diverMsgCount = 0;
  let answeredCount = 0;
  const responseDeltasHours: number[] = [];

  byTour.forEach((msgs) => {
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    sorted.forEach((m, i) => {
      if (m.senderRole !== "diver") return;
      diverMsgCount += 1;
      const reply = sorted
        .slice(i + 1)
        .find((next) => next.senderRole === "instructor" && next.senderProfileId === instructorProfileId);
      if (reply) {
        answeredCount += 1;
        const deltaHours =
          (new Date(reply.createdAt).getTime() - new Date(m.createdAt).getTime()) / (1000 * 60 * 60);
        responseDeltasHours.push(deltaHours);
      }
    });
  });

  const responseRate = diverMsgCount > 0 ? Math.round((answeredCount / diverMsgCount) * 100) : null;
  const avgResponseHours =
    responseDeltasHours.length > 0
      ? responseDeltasHours.reduce((sum, v) => sum + v, 0) / responseDeltasHours.length
      : null;

  return { responseRate, avgResponseHours };
}

function formatResponseSpeed(hours: number | null): string {
  if (hours === null) return "데이터 없음";
  if (hours < 1) return `평균 ${Math.max(1, Math.round(hours * 60))}분 이내`;
  if (hours < 24) return `평균 ${Math.round(hours)}시간 이내`;
  return `평균 ${Math.round(hours / 24)}일 이내`;
}

const InstructorPublicProfile = () => {
  const { id } = useParams();
  const { getInstructorById, tours, bookings, chatMessages, diverProfiles, getReviewsByInstructorId } =
    useAppData();

  const instructor = id ? getInstructorById(id) : undefined;

  const myTours = useMemo(
    () => (instructor ? tours.filter((t) => t.instructorId === instructor.id) : []),
    [tours, instructor],
  );
  const myTourIds = useMemo(() => new Set(myTours.map((t) => t.id)), [myTours]);

  const myBookings = useMemo(
    () => bookings.filter((b) => myTourIds.has(b.tourId)),
    [bookings, myTourIds],
  );

  const upcomingTours = useMemo(
    () => myTours.filter((t) => !isPastDate(t.endDate)).sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [myTours],
  );
  const completedTours = useMemo(
    () => myTours.filter((t) => isPastDate(t.endDate)).sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [myTours],
  );

  const activeCountries = useMemo(
    () => Array.from(new Set(myTours.map((t) => t.country))).filter(Boolean),
    [myTours],
  );
  const activeSites = useMemo(
    () => Array.from(new Set(myTours.map((t) => t.site))).filter(Boolean),
    [myTours],
  );

  const reviews = instructor ? getReviewsByInstructorId(instructor.id) : [];
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const totalParticipants = myBookings.filter((b) => b.status === "confirmed").length;

  const cancellationRate = useMemo(() => {
    if (myBookings.length === 0) return null;
    const cancelled = myBookings.filter((b) => b.status === "cancelled").length;
    return Math.round((cancelled / myBookings.length) * 100);
  }, [myBookings]);

  const { responseRate, avgResponseHours } = useMemo(() => {
    if (!instructor) return { responseRate: null, avgResponseHours: null };
    const myMessages = chatMessages.filter((m) => myTourIds.has(m.tourId));
    return computeResponseStats(myMessages, instructor.id);
  }, [chatMessages, myTourIds, instructor]);

  const lastActiveAt = useMemo(() => {
    if (!instructor) return undefined;
    const myInstructorMessages = chatMessages.filter(
      (m) => myTourIds.has(m.tourId) && m.senderRole === "instructor" && m.senderProfileId === instructor.id,
    );
    if (myInstructorMessages.length === 0) return undefined;
    return myInstructorMessages.reduce(
      (latest, m) => (m.createdAt > latest ? m.createdAt : latest),
      myInstructorMessages[0].createdAt,
    );
  }, [chatMessages, myTourIds, instructor]);

  if (!instructor) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 bg-gradient-surface p-6 text-center">
        <MessageCircleOff className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">강사 프로필을 찾을 수 없습니다.</p>
        <Link to="/" className="text-sm font-medium text-primary underline underline-offset-4">
          홈으로 돌아가기
        </Link>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-surface pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-md items-center gap-3 px-4 md:max-w-lg">
          <Link to="/" className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="line-clamp-1 text-base font-semibold text-foreground">강사 프로필</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md space-y-4 px-4 py-4 md:max-w-lg">
        {/* 프로필 헤더 */}
        <Card className="border-primary/20 bg-gradient-surface">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between">
              {instructor.verified && <VerifiedBadge size="md" />}
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16 border border-border">
                <AvatarImage src={instructor.avatarUrl} alt={instructor.name} crossOrigin="anonymous" />
                <AvatarFallback className="bg-primary text-xl font-bold text-primary-foreground">
                  {instructor.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-base font-semibold text-foreground">{instructor.name} 강사</p>
                  {instructor.agency && (
                    <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                      {instructor.agency}
                    </Badge>
                  )}
                </div>
                {reviews.length > 0 && (
                  <p className="flex items-center gap-1 pt-0.5 text-xs font-medium text-foreground">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    {avgRating.toFixed(1)} · 후기 {reviews.length}개
                  </p>
                )}
              </div>
            </div>
            {instructor.bio && (
              <p className="whitespace-pre-line break-keep text-sm text-muted-foreground">{instructor.bio}</p>
            )}
            {instructor.languages && instructor.languages.length > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Languages className="h-3.5 w-3.5 text-primary" />
                {instructor.languages.join(", ")}
              </p>
            )}
            {(activeCountries.length > 0 || activeSites.length > 0) && (
              <p className="flex items-start gap-1.5 break-keep text-xs text-muted-foreground">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  {activeCountries.length > 0 && `활동 국가: ${activeCountries.join(", ")}`}
                  {activeCountries.length > 0 && activeSites.length > 0 && " · "}
                  {activeSites.length > 0 && `활동 지역: ${activeSites.join(", ")}`}
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* 신뢰 지표 */}
        <Card>
          <CardContent className="grid grid-cols-2 gap-2.5 p-4">
            <div className="flex flex-col items-center gap-0.5 rounded-lg bg-secondary px-2 py-3 text-center">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-muted-foreground">경력</span>
              <span className="text-sm font-bold text-foreground">{instructor.experienceYears}년</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 rounded-lg bg-secondary px-2 py-3 text-center">
              <CalendarCheck className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-muted-foreground">진행 투어</span>
              <span className="text-sm font-bold text-foreground">{myTours.length}회</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 rounded-lg bg-secondary px-2 py-3 text-center">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-muted-foreground">누적 참가자</span>
              <span className="text-sm font-bold text-foreground">{totalParticipants}명</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 rounded-lg bg-secondary px-2 py-3 text-center">
              <TrendingDown className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-muted-foreground">취소율</span>
              <span className="text-sm font-bold text-foreground">
                {cancellationRate === null ? "-" : `${cancellationRate}%`}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 rounded-lg bg-secondary px-2 py-3 text-center">
              <Globe2 className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-muted-foreground">채팅 응답률</span>
              <span className="text-sm font-bold text-foreground">
                {responseRate === null ? "-" : `${responseRate}%`}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 rounded-lg bg-secondary px-2 py-3 text-center">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-muted-foreground">응답 속도</span>
              <span className="text-[11px] font-bold leading-tight text-foreground">
                {formatResponseSpeed(avgResponseHours)}
              </span>
            </div>
          </CardContent>
          {lastActiveAt && (
            <CardContent className="pt-0 pb-3 text-center text-[11px] text-muted-foreground">
              최근 활동: {formatDateKR(lastActiveAt)}
            </CardContent>
          )}
        </Card>

        {/* 예정된 투어 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">예정된 투어</h3>
          {upcomingTours.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">예정된 투어가 없습니다.</p>
          ) : (
            <div className="space-y-1.5">
              {upcomingTours.map((t) => (
                <Link key={t.id} to={`/tour/${t.id}`}>
                  <Card className="transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center justify-between p-3">
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-medium text-foreground">{t.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {t.country} · {formatDateRangeKR(t.startDate, t.endDate)}
                        </p>
                      </div>
                      <Badge variant={t.status === "open" ? "default" : "outline"} className="shrink-0 text-[10px]">
                        {t.status === "open" ? "모집중" : "마감"}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 완료된 투어 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">완료된 투어</h3>
          {completedTours.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">완료된 투어가 없습니다.</p>
          ) : (
            <div className="space-y-1.5">
              {completedTours.slice(0, 10).map((t) => (
                <Link key={t.id} to={`/tour/${t.id}`}>
                  <Card className="transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center justify-between p-3">
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-medium text-foreground">{t.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {t.country} · {formatDateRangeKR(t.startDate, t.endDate)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        완료
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 후기 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">후기</h3>
            {reviews.length > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 text-warning" />
                <span className="font-bold text-foreground">{avgRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({reviews.length}개)</span>
              </div>
            )}
          </div>
          {reviews.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">아직 등록된 후기가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {reviews.slice(0, 20).map((review) => {
                const reviewerName = diverProfiles.find((p) => p.id === review.diverId)?.name;
                return (
                  <Card key={review.id}>
                    <CardContent className="space-y-1.5 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={
                                star <= review.rating
                                  ? "h-3.5 w-3.5 text-warning"
                                  : "h-3.5 w-3.5 text-muted-foreground"
                              }
                            />
                          ))}
                          <span className="ml-1 text-[11px] text-muted-foreground">
                            {maskName(reviewerName ?? "다이버")}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{formatDateKR(review.createdAt)}</span>
                      </div>
                      {review.title && <p className="text-sm font-semibold text-foreground">{review.title}</p>}
                      {review.comment && <p className="text-xs text-muted-foreground">{review.comment}</p>}
                      {review.instructorReply && (
                        <div className="ml-2 space-y-0.5 rounded-lg border-l-2 border-primary/50 bg-secondary/40 p-2">
                          <p className="text-[11px] font-semibold text-primary">강사 답글</p>
                          <p className="break-keep text-xs text-foreground">{review.instructorReply}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default InstructorPublicProfile;
