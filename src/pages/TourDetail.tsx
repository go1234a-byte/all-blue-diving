import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Backpack, Bookmark, CalendarDays, Compass, MapPin, MessageCircle, ShieldCheck, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TourGallery } from "@/components/tour/TourGallery";
import { InstructorTrustCard } from "@/components/tour/InstructorTrustCard";
import { TourFlightInfoCard } from "@/components/tour/TourFlightInfoCard";
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
import { applyPlatformFee, formatKRW } from "@/lib/pricing";
import { calculateAge, formatDateKR, formatDateRangeKR } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ACTIVITY_LABEL, ACTIVITY_BADGE_CLASS } from "@/lib/activityBadge";

const TourDetail = () => {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const {
    getTourById,
    getInstructorById,
    getDiveCenterByInstructorId,
    getCenterById,
    isBookmarked,
    toggleBookmark,
    bookings,
    diverProfiles,
    toursLoading,
    instructorsLoading,
    getConfirmedParticipantCount,
    getReviewsByTourId,
  } = useAppData();
  const { isLoggedIn, currentDiverId, currentInstructorId, authLoading } = useRole();
  const { toast } = useToast();
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

  const tour = tourId ? getTourById(tourId) : undefined;
  const instructor = tour ? getInstructorById(tour.instructorId) : undefined;
  const diveCenter = tour ? getDiveCenterByInstructorId(tour.instructorId) : undefined;
  const center = tour?.centerId ? getCenterById(tour.centerId) : undefined;

  if ((toursLoading || instructorsLoading) && (!tour || !instructor)) {
    return (
      <div className="flex min-h-full items-center justify-center p-6 text-sm text-muted-foreground">
        불러오는 중...
      </div>
    );
  }

  if (!tour || !instructor) {
    return (
      <div className="flex min-h-full items-center justify-center p-6 text-sm text-muted-foreground">
        투어 정보를 찾을 수 없습니다.
      </div>
    );
  }

  // 로그인 직후 session -> profiles 조회가 끝나기 전까지는 currentDiverId/currentInstructorId가
  // 아직 확정되지 않아, authLoading을 안 보면 이미 예약했는데도 "예약하기" 버튼이 잠깐 잘못
  // 보이거나 담당 강사 본인인데도 강사 전용 버튼이 잠깐 안 보인다. 다른 페이지와 동일하게
  // 인증 확인 중에는 로딩 상태만 보여준다.
  if (authLoading) {
    return (
      <div className="flex min-h-full items-center justify-center p-6 text-sm text-muted-foreground">
        인증 정보를 확인하는 중...
      </div>
    );
  }

  const bookmarked = isBookmarked(tour.id);
  const myBooking = currentDiverId
    ? bookings.find((b) => b.tourId === tour.id && b.diverId === currentDiverId && b.status !== "cancelled")
    : undefined;
  // bookings 배열은 RLS 때문에 이 투어의 담당 강사/관리자가 아니면 다른 사람 예약이 안 보이므로,
  // 상단에 표시되는 "X/N명 모집" 정원은 반드시 공개 집계 뷰 기반 헬퍼로 계산해야 한다. (아래
  // 참가자 목록 자체는 담당 강사일 때만 노출되는 영역이라 bookings를 그대로 써도 된다.)
  const confirmedCount = getConfirmedParticipantCount(tour.id);
  const tourReviews = getReviewsByTourId(tour.id);
  const averageRating = tourReviews.length > 0
    ? tourReviews.reduce((sum, r) => sum + r.rating, 0) / tourReviews.length
    : 0;
  // 실제 데이터 기반 하이라이트: 강사가 등록한 특징 태그 + 소규모/전담 강사 케어 등
  // 항상 참인 사실만 노출한다 (시안 문구를 그대로 베끼지 않고 실제 값으로 채움).
  const highlightItems: { icon: typeof Compass; label: string; sub: string }[] = [
    ...(tour.tags ?? []).slice(0, 2).map((tag) => ({ icon: Compass, label: tag, sub: "투어 특징" })),
    // 강사가 투어 등록/수정 시 "1:1 케어 투어"를 직접 체크한 경우에만 노출한다.
    // (예전에는 선택란 없이 모든 투어에 항상 고정 문구로 노출되던 버그였음.)
    ...(tour.oneOnOneCare
      ? [{ icon: Users, label: `${instructor.name} 강사 1:1 케어`, sub: "전담 강사 진행" }]
      : []),
    { icon: ShieldCheck, label: `최대 ${tour.maxParticipants}명 소규모`, sub: "안전 최우선 운영" },
  ].slice(0, 4);
  const selectedOptionsTotal = tour.customOptions
    .filter((o) => o.isActive && selectedOptionIds.includes(o.id))
    .reduce((sum, o) => sum + o.price, 0);
  // 결제 화면(computeInvoice)과 동일하게 [투어 금액 소계]에 플랫폼 이용 수수료 10%를 더해서 보여준다.
  // 이렇게 해야 투어 카드/상세에서 본 가격과 실제 체크아웃 결제 금액이 정확히 일치한다.
  const displayTotal = applyPlatformFee(tour.basePrice + selectedOptionsTotal);
  // 정원이 다 찼는데도 status가 아직 "open"으로 남아있는 경우(자동 마감 처리 이전)를 대비해,
  // 확정 인원이 최대 인원에 도달하면 그 자체로도 예약을 막는다 — 그렇지 않으면 화면상 "N/M명 모집"이
  // 꽉 찬 걸 보면서도 예약하기 버튼은 계속 눌려서 초과 예약(오버부킹)이 가능했다.
  const isFull = confirmedCount >= tour.maxParticipants;
  // 관리자가 정지/보류 처리했거나, 모집이 마감된 투어(최소 인원 미달로 취소된 경우 포함)는
  // 더 이상 예약을 받을 수 없다. tour.status는 instructor 콘솔뿐 아니라 실제 예약 가능 여부에도 반영해야 한다.
  const isBookingBlocked = Boolean(tour.adminStatus) || tour.status === "closed" || isFull;
  const alreadyBooked = Boolean(myBooking);

  const handleBookNow = () => {
    if (isBookingBlocked) {
      toast({
        title: tour.adminStatus === "suspended"
          ? "정지된 투어예요"
          : tour.adminStatus === "held"
          ? "보류중인 투어예요"
          : !tour.isConfirmed
          ? "취소된 투어예요"
          : "마감된 투어예요",
        description: "현재 예약을 받을 수 없는 투어입니다.",
        variant: "destructive",
      });
      return;
    }
    if (alreadyBooked) {
      toast({ title: "이미 예약한 투어예요", description: "같은 투어는 중복으로 예약할 수 없습니다." });
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
            onClick={() => {
              // 이미 찜한 상태(해제)는 항상 허용하되, 예약 불가능한 투어는 새로 찜하지 못하게 막는다.
              if (!bookmarked && isBookingBlocked) {
                toast({
                  title: "찜할 수 없는 투어예요",
                  description: "예약이 마감/취소되었거나 정지된 투어는 위시리스트에 담을 수 없습니다.",
                  variant: "destructive",
                });
                return;
              }
              toggleBookmark(tour.id);
            }}
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
                : tour.adminStatus === "held"
                ? "관리자 검토로 보류중인 투어입니다. 검토가 끝날 때까지 예약을 받을 수 없습니다."
                : !tour.isConfirmed
                ? "모집 마감 후 최소 인원 미달로 취소된 투어입니다. 예약을 받을 수 없습니다."
                : "모집이 마감된 투어입니다. 더 이상 예약을 받을 수 없습니다."}
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
              <Badge key={t} className={cn("border-0", ACTIVITY_BADGE_CLASS[t])}>
                {ACTIVITY_LABEL[t]}
              </Badge>
            ))}
            <Badge variant="secondary">{CERTIFICATION_LABELS[tour.certificationLevel]}</Badge>
            {tour.minLogCount != null && tour.minLogCount > 0 && (
              <Badge variant="outline">로그수 {tour.minLogCount}회 이상</Badge>
            )}
          </div>
          <h2 className="text-xl font-bold text-foreground">{tour.title}</h2>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span>{tour.country} · {tour.site}</span>
            {tourReviews.length > 0 && (
              <span className="flex items-center gap-1 text-foreground">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                <span className="font-semibold">{averageRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({tourReviews.length}개 후기)</span>
              </span>
            )}
          </div>
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

        {/* 투어 하이라이트 — 강사가 등록한 특징 태그 + 소규모/전담 케어 등 실제 데이터 기반 요약 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">투어 하이라이트</h3>
          <div className="grid grid-cols-2 gap-2">
            {highlightItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">{item.label}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{item.sub}</p>
                  </div>
                </div>
              );
            })}
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
                      className="space-y-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {b.diverName}
                          {age != null ? ` ${age}세` : ""} · {b.gender === "male" ? "남" : "여"}
                          {b.participantCount > 1 ? ` · 본인 포함 ${b.participantCount}명` : ""}
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
                      {/* 동반자별 상세 정보(companions)가 있으면 한 명씩 풀어서 보여주고,
                          예전 예약처럼 companions 없이 companionNames 텍스트만 있으면 그걸로 대신한다. */}
                      {b.companions && b.companions.length > 0 ? (
                        <div className="space-y-1 border-t border-border pt-1.5">
                          {b.companions.map((c, i) => (
                            <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                동반자 {i + 1} · {c.name} · {c.gender === "female" ? "여" : "남"}
                              </span>
                              <span className="flex gap-1">
                                {c.smoking && (
                                  <Badge variant="outline" className="text-[9px]">
                                    흡연
                                  </Badge>
                                )}
                                {c.snoring && (
                                  <Badge variant="outline" className="text-[9px]">
                                    코골이
                                  </Badge>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        b.companionNames && (
                          <p className="text-xs text-muted-foreground">동반자: {b.companionNames}</p>
                        )
                      )}
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

        {/* 1-1) 항공편 정보 (강사가 입력한 경우에만 노출) */}
        <TourFlightInfoCard flightInfo={tour.flightInfo} />

        {/* 2) 투어 소개 */}
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
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
            1인 기준 · 수수료 포함{selectedOptionsTotal > 0 ? " · 옵션 포함" : ""}
          </p>
          <p className="text-lg font-bold text-primary">{formatKRW(displayTotal)}</p>
        </div>
        <Button size="lg" onClick={handleBookNow} disabled={isBookingBlocked || alreadyBooked}>
          {isBookingBlocked ? "예약 불가" : alreadyBooked ? "이미 예약함" : "예약하기"}
        </Button>
      </div>
    </div>
  );
};

export default TourDetail;
