import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, MessageCircle, Star, Users } from "lucide-react";
import type { Tour } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { VerifiedBadge } from "@/components/tour/VerifiedBadge";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { applyPlatformFee, formatKRW } from "@/lib/pricing";
import { formatDateRangeKR } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";
import { isTourBookable } from "@/lib/tourBooking";
import { ACTIVITY_LABEL, ACTIVITY_BADGE_CLASS } from "@/lib/activityBadge";

interface TourCardProps {
  tour: Tour;
}

export function TourCard({ tour }: TourCardProps) {
  const {
    getInstructorById,
    isBookmarked,
    toggleBookmark,
    tours,
    toggleInstructorBookmark,
    isInstructorBookmarked,
    getConfirmedParticipantCount,
    addSupportTicket,
  } = useAppData();
  const { profile, isLoggedIn } = useRole();
  const { toast } = useToast();
  const navigate = useNavigate();
  const instructor = getInstructorById(tour.instructorId);
  const bookmarked = isBookmarked(tour.id);
  const bookable = isTourBookable(tour);
  // bookings 배열은 RLS 때문에 게스트/다른 다이버에게는 다른 사람 예약이 안 보이므로,
  // 홈/검색 카드에 표시되는 정원은 반드시 공개 집계 뷰 기반 헬퍼로 계산해야 한다.
  const confirmedCount = getConfirmedParticipantCount(tour.id);
  // 정원이 다 찬 경우 "모집마감"으로 표시한다. tour.status(관리자 취소 등)와는 별개로,
  // 순수하게 "자리가 다 찼는지"만 보고 판단한다.
  const isFull = confirmedCount >= tour.maxParticipants;
  // 강사의 경력/로그 수와 등록한 총 투어 수(진행 투어)를 투어 카드의 강사 정보에 함께 보여준다.
  const instructorTourCount = instructor ? tours.filter((t) => t.instructorId === instructor.id).length : 0;

  // 모집마감 투어에서 "강사에게 문의하기"를 누르면, 기존 1:1 문의(support_tickets) 파이프라인을
  // 재사용해 접수한다 — 별도 예약 없이도 로그인만 하면 등록 가능(RLS: 인증된 사용자 누구나 insert
  // 가능)하고, 관리자 문의 관리 화면에서 그대로 확인 후 강사에게 전달할 수 있다.
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  const handleSubmitInquiry = async () => {
    if (!inquiryMessage.trim()) {
      toast({ title: "문의 내용을 입력해주세요", variant: "destructive" });
      return;
    }
    if (!isLoggedIn || !profile?.id) {
      setInquiryOpen(false);
      toast({
        title: "로그인이 필요합니다",
        description: "강사에게 문의하려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setSubmittingInquiry(true);
    try {
      await addSupportTicket({
        userId: profile.id,
        type: "inquiry",
        title: `[투어 문의] ${tour.title}`,
        content:
          `담당 강사: ${instructor?.name ?? "미배정"} 강사\n` +
          `투어: ${tour.title} (${tour.country} · ${tour.site})\n\n` +
          inquiryMessage.trim(),
        attachmentNames: [],
      });
      toast({ title: "문의가 접수되었습니다", description: "담당자 확인 후 강사에게 전달해드릴게요." });
      setInquiryMessage("");
      setInquiryOpen(false);
    } catch (err) {
      toast({
        title: "문의 접수에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setSubmittingInquiry(false);
    }
  };

  return (
    <>
      <Link to={`/tour/${tour.id}`}>
        <Card className="group overflow-hidden rounded-2xl border-border/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-ocean-glow">
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <img
              src={tour.mainImageUrl || IMAGE_PLACEHOLDER}
              alt={tour.title}
              onError={handleImageFallback}
              className={cn(
                "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
                isFull && "opacity-80 grayscale-[35%]",
              )}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
            <div className="absolute left-2 top-2 flex flex-wrap gap-1">
              {isFull && (
                <Badge className="border-0 bg-foreground/90 text-background backdrop-blur">모집마감</Badge>
              )}
              {tour.activityTypes.map((type) => (
                <Badge key={type} className={cn("border-0 backdrop-blur", ACTIVITY_BADGE_CLASS[type])}>
                  {ACTIVITY_LABEL[type]}
                </Badge>
              ))}
              {tour.minLogCount != null && tour.minLogCount > 0 && (
                <Badge variant="outline" className="border-none bg-background/85 text-foreground backdrop-blur">
                  로그수 {tour.minLogCount}회 이상
                </Badge>
              )}
              {(tour.tags ?? []).slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="border-none bg-background/85 text-foreground backdrop-blur">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
              <div className="flex items-center gap-1 rounded-full bg-background/85 px-2 py-1 text-xs font-semibold text-foreground backdrop-blur">
                <Star className="h-3 w-3 text-warning" />
                {tour.rating.toFixed(1)}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  // 이미 찜한 상태(해제)는 항상 허용하되, 예약 불가능한 투어는 새로 찜하지 못하게 막는다.
                  if (!bookmarked && !bookable) {
                    toast({
                      title: "찜할 수 없는 투어예요",
                      description: "예약이 마감/취소되었거나 정지된 투어는 위시리스트에 담을 수 없습니다.",
                      variant: "destructive",
                    });
                    return;
                  }
                  toggleBookmark(tour.id);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-background/85 backdrop-blur"
                aria-label="찜하기"
              >
                <Bookmark
                  className={cn("h-3.5 w-3.5", bookmarked ? "fill-primary text-primary" : "text-foreground")}
                />
              </button>
            </div>
          </div>
          <CardContent className="space-y-3 p-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                {tour.country} · {tour.site}
              </div>
              <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{tour.title}</h3>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {formatDateRangeKR(tour.startDate, tour.endDate)}
                </span>
                <span
                  className={cn(
                    "flex shrink-0 items-center gap-1 text-[11px] font-medium",
                    isFull ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  <Users className="h-3 w-3" />
                  {confirmedCount}/{tour.maxParticipants}명
                </span>
              </div>
            </div>

            {instructor && (
              <div className="space-y-2 rounded-xl border border-border bg-secondary/50 p-2.5">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 shrink-0 border border-border">
                    <AvatarImage src={instructor.avatarUrl} alt={instructor.name} />
                    <AvatarFallback className="bg-primary text-[11px] text-primary-foreground">
                      {instructor.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {/* 강사 이름은 항상 한 줄 전체 폭을 갖도록 분리했다 — 이전에는 이름과 소속(agency)
                      배지가 같은 줄에서 폭을 나눠 가져서, 소속명이 길면(예: "TDI Tech Instructor")
                      이름이 "김..."처럼 한두 글자만 남고 잘리거나 아예 안 보이는 문제가 있었다. */}
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-foreground">
                      {instructor.name} 강사
                    </span>
                    {(instructor.agency || instructor.verified) && (
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        {instructor.agency && (
                          <Badge variant="outline" className="max-w-[130px] truncate px-1.5 py-0 text-[9px]">
                            {instructor.agency}
                          </Badge>
                        )}
                        {instructor.verified && <VerifiedBadge />}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleInstructorBookmark(instructor.id);
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-background/60"
                    aria-label="강사 찜하기"
                  >
                    <Bookmark
                      className={cn(
                        "h-3.5 w-3.5",
                        isInstructorBookmarked(instructor.id) ? "fill-primary text-primary" : "text-muted-foreground",
                      )}
                    />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-lg bg-background/60 px-2 py-1.5 text-center">
                    <p className="text-[9px] text-muted-foreground">경력/로그</p>
                    <p className="text-[11px] font-semibold text-foreground">
                      {instructor.experienceYears}년/{instructor.totalLogs.toLocaleString()}+
                    </p>
                  </div>
                  <div className="rounded-lg bg-background/60 px-2 py-1.5 text-center">
                    <p className="text-[9px] text-muted-foreground">진행 투어</p>
                    <p className="text-[11px] font-semibold text-foreground">{instructorTourCount}회</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-base font-bold text-primary">{formatKRW(applyPlatformFee(tour.basePrice))}~</span>
              {isFull && instructor && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0 gap-1 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    setInquiryOpen(true);
                  }}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  강사에게 문의하기
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>

      {instructor && (
        <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{instructor.name} 강사에게 문의하기</DialogTitle>
              <DialogDescription>
                모집이 마감된 투어예요. 대기 등록이나 다음 일정 등 궁금한 점을 남기면 담당자 확인 후 강사에게
                전달해드려요.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={inquiryMessage}
              onChange={(e) => setInquiryMessage(e.target.value)}
              placeholder="문의하실 내용을 자세히 적어주세요"
              rows={5}
            />
            <DialogFooter>
              <Button className="w-full" onClick={handleSubmitInquiry} disabled={submittingInquiry}>
                {submittingInquiry ? "접수 중..." : "문의 접수하기"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
