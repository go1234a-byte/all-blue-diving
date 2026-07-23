import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Backpack, Bookmark, CalendarDays, MapPin, MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TourGallery } from "@/components/tour/TourGallery";
import { InstructorTrustCard } from "@/components/tour/InstructorTrustCard";
import { DiveCenterCard } from "@/components/tour/DiveCenterCard";
import { TourCenterCard } from "@/components/tour/TourCenterCard";
import { InclusionsExclusionsCard } from "@/components/tour/InclusionsExclusionsCard";
import { TourOptionsSelector } from "@/components/tour/TourOptionsSelector";
import { ReviewList } from "@/components/tour/ReviewList";
import { PolicyDisclosure } from "@/components/policy/PolicyDisclosure";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { CERTIFICATION_LABELS } from "@/lib/constants";
import { formatKRW } from "@/lib/pricing";
import { calculateAge, formatDateKR, formatDateRangeKR } from "@/lib/dates";
import { cn } from "@/lib/utils";

const ACTIVITY_LABEL: Record<string, string> = {
  scuba: "스쿠버다이빙",
  freediving: "프리다이빙",
};

const TourDetail = () => {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const { getTourById, getInstructorById, getDiveCenterByInstructorId, getCenterById, isBookmarked, toggleBookmark, bookings, diverProfiles } =
    useAppData();
  const { isLoggedIn, currentDiverId, currentInstructorId } = useRole();
  const { toast } = useToast();
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

  const tour = tourId ? getTourById(tourId) : undefined;
  const instructor = tour ? getInstructorById(tour.instructorId) : undefined;
  const diveCenter = tour ? getDiveCenterByInstructorId(tour.instructorId) : undefined;
  const center = tour?.centerId ? getCenterById(tour.centerId) : undefined;

  if (!tour || !instructor) {
    return (
      <div className="flex min-h-full items-center justify-center p-6 text-sm text-muted-foreground">
        투어 정보를 찾을 수 없습니다.
      </div>
    );
  }

  const bookmarked = isBookmarked(tour.id);
  const myBooking = currentDiverId
    ? bookings.find((b) => b.tourId === tour.id && b.diverId === currentDiverId && b.status !== "cancelled")
    : undefined;
  const confirmedCount = bookings.filter((b) => b.tourId === tour.id && b.status === "confirmed").length;
  const selectedOptionsTotal = tour.customOptions
    .filter((o) => o.isActive && selectedOptionIds.includes(o.id))
    .reduce((sum, o) => sum + o.price, 0);
  const displayTotal = tour.basePrice + selectedOptionsTotal;
  const isBookingBlocked = Boolean(tour.adminStatus);

  const handleBookNow = () => {
    if (isBookingBlocked) {
      toast({
        title: tour.adminStatus === "suspended" ? "정지된 투어예요" : "보류중인 투어예요",
        description: "현재 예약을 받을 수 없는 투어입니다.",
        variant: "destructive",
      });
      return;
    }
    if (!isLoggedIn) {
      // 비회원은 투어를 자유롭게 둘러볼 수 있고, "예약하기"를 누르는 시점에만 회원가입/로그인을 안내한다.
      // 가입 완료 후에는 원래 보던 투어의 결제 화면으로 자동으로 돌아온다.
      navigate("/auth", {
        state: {
          returnTo: `/checkout/${tour.id}`,
          returnState: { selectedOptionIds },
          reason: "booking",
        },
      });
      return;
    }
    navigate(`/checkout/${tour.id}`, { state: { selectedOptionIds } });
  };

  return (
    <div className="min-h-full bg-gradient-surface pb-28">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-md items-center gap-3 px-4 md:max-w-lg">
          <Link to="/" className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="line-clamp-1 flex-1 text-base font-semibold text-foreground">{tour.title}</h1>
          <button
            type="button"
            onClick={() => toggleBookmark(tour.id)}
            className="text-foreground"
            aria-label="찜하기"
          >
            <Bookmark className={cn("h-5 w-5", bookmarked && "fill-primary text-primary")} />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md space-y-6 px-4 py-5 md:max-w-lg">
        {isBookingBlocked && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {tour.adminStatus === "suspended"
                ? "관리자에 의해 정지된 투어입니다. 예약을 받을 수 없습니다."
                : "관리자 검토로 보류중인 투어입니다. 검토가 끝날 때까지 예약을 받을 수 없습니다."}
            </span>
          </div>
        )}
        {myBooking && (
          <Link
            to={`/chat/${tour.id}`}
            className="flex items-center gap-2 rounded-xl border border-primary/30 bg-secondary/40 p-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
            예약한 투어예요 · 대시보드 바로가기
          </Link>
        )}

        <TourGallery mainImageUrl={tour.mainImageUrl} galleryUrls={tour.galleryUrls} title={tour.title} />

        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {tour.activityTypes.map((t) => (
              <Badge key={t} className="bg-primary text-primary-foreground">
                {ACTIVITY_LABEL[t]}
              </Badge>
            ))}
            <Badge variant="secondary">{CERTIFICATION_LABELS[tour.certificationLevel]}</Badge>
          </div>
          <h2 className="text-xl font-bold text-foreground">{tour.title}</h2>
          <p className="text-sm text-muted-foreground">{tour.country} · {tour.site}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl border border-primary/20 bg-card p-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {formatDateRangeKR(tour.startDate, tour.endDate)}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            {confirmedCount}/{tour.maxParticipants}명 모집
          </div>
          {(tour.meetingPoint || tour.meetingTime) && (
            <div className="col-span-2 flex items-start gap-2 border-t border-primary/20 pt-2 text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {tour.meetingPoint}
                {tour.meetingPoint && tour.meetingTime ? " · " : ""}
                {tour.meetingTime}
              </span>
            </div>
          )}
          <div className="col-span-2 border-t border-primary/20 pt-2 text-xs text-warning-foreground">
            모집 마감일: {formatDateKR(tour.recruitmentDeadline)}까지
          </div>
        </div>

        {/* 담당 강사 본인이 자신의 투어를 볼 때만: 누가 예약했는지 이름/나이/성별/흡연·코골이 여부를 보여준다. */}
        {tour.instructorId === currentInstructorId && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              참가자 목록 ({confirmedCount}/{tour.maxParticipants}명)
            </h3>
            <div className="space-y-1.5">
              {bookings
                .filter((b) => b.tourId === tour.id && b.status === "confirmed")
                .map((b) => {
                  const diverProfile = diverProfiles.find((p) => p.id === b.diverId);
                  const age = diverProfile?.birthDate ? calculateAge(diverProfile.birthDate) : undefined;
                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-foreground">
                        {b.diverName}
                        {age != null ? ` ${age}세` : ""} · {b.gender === "male" ? "남" : "여"}
                      </span>
                      <span className="flex gap-1">
                        {b.smoking && (
                          <Badge variant="outline" className="text-[10px]">
                            흡연
                          </Badge>
                        )}
                        {b.snoring && (
                          <Badge variant="outline" className="text-[10px]">
                            코골이
                          </Badge>
                        )}
                      </span>
                    </div>
                  );
                })}
              {confirmedCount === 0 && (
                <p className="text-xs text-muted-foreground">아직 예약한 참가자가 없습니다.</p>
              )}
            </div>
          </div>
        )}

        {/* 1) 담당 강사 프로필 */}
        <InstructorTrustCard instructor={instructor} />

        {/* 2) 투어 소개 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">투어 소개</h3>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {tour.description}
          </p>
        </div>

        {/* 2-1) 일자별 일정 (강사가 투어 생성 시 등록한 일정) */}
        {tour.itineraryDays && tour.itineraryDays.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">일자별 일정</h3>
            <div className="space-y-2">
              {tour.itineraryDays.map((day) => (
                <div key={day.dayNumber} className="space-y-1.5 rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">{day.title}</p>
                  {day.briefing && (
                    <p className="break-keep text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">브리핑 </span>
                      {day.briefing}
                    </p>
                  )}
                  {day.diving && (
                    <p className="break-keep text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">다이빙 </span>
                      {day.diving}
                    </p>
                  )}
                  {day.meals && (
                    <p className="break-keep text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">식사 </span>
                      {day.meals}
                    </p>
                  )}
                  {day.freeTime && (
                    <p className="break-keep text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">자유시간 </span>
                      {day.freeTime}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3) 예약된 센터 소개 */}
        {diveCenter && <DiveCenterCard diveCenter={diveCenter} />}
        {center && <TourCenterCard center={center} />}

        {/* 4) 강사 추천 준비물 — 포함/불포함보다 먼저, 눈에 띄게 노출 */}
        {tour.prepNotes && (
          <div className="space-y-2 rounded-xl border-2 border-primary bg-primary/10 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Backpack className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold text-primary">강사 추천 준비물</h3>
              <Badge className="bg-primary text-primary-foreground">필독</Badge>
            </div>
            <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-foreground">{tour.prepNotes}</p>
          </div>
        )}

        {/* 5) 포함 및 불포함 사항 */}
        <InclusionsExclusionsCard inclusions={tour.inclusions} exclusions={tour.exclusions} />

        <TourOptionsSelector
          options={tour.customOptions}
          selectedIds={selectedOptionIds}
          onChange={setSelectedOptionIds}
        />

        <ReviewList tourId={tour.id} />

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">주요 정책 및 안전 규정</h3>
          <PolicyDisclosure />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-md items-center justify-between gap-4 border-t border-border bg-card/95 px-4 py-3 backdrop-blur md:max-w-lg">
        <div>
          <p className="text-xs text-muted-foreground">
            1인 기준{selectedOptionsTotal > 0 ? " · 옵션 포함" : ""}
          </p>
          <p className="text-lg font-bold text-primary">{formatKRW(displayTotal)}</p>
        </div>
        <Button size="lg" onClick={handleBookNow} disabled={isBookingBlocked}>
          {isBookingBlocked ? "예약 불가" : "예약하기"}
        </Button>
      </div>
    </div>
  );
};

export default TourDetail;
