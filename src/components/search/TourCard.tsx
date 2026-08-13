import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, MessageCircle, Share2, Star, Users } from "lucide-react";
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
import { formatDateRangeKR, formatNightsDaysKR } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";
import { isTourBookable } from "@/lib/tourBooking";
import { shareOrCopyLink } from "@/lib/share";
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
  const confirmedCount = getConfirmedParticipantCount(tour.id);
  const isFull = confirmedCount >= tour.maxParticipants;
  const instructorTourCount = instructor ? tours.filter((t) => t.instructorId === instructor.id).length : 0;

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

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const result = await shareOrCopyLink({
      title: tour.title,
      text: `${tour.country} · ${tour.site} — ALL BLUE`,
      url: `${window.location.origin}/tour/${tour.id}`,
    });
    if (result === "copied") {
      toast({ title: "링크가 복사되었습니다", description: "카카오톡, 인스타그램 등에 붙여넣기 해보세요." });
    } else if (result === "failed") {
      toast({ title: "공유에 실패했습니다", variant: "destructive" });
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
                onClick={handleShare}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-background/85 backdrop-blur"
                aria-label="공유하기"
              >
                <Share2 className="h-3.5 w-3.5 text-foreground" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
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
              <div className="text-[11px] font-medium text-muted-foreground">
                {formatNightsDaysKR(tour.startDate, tour.endDate)}
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
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-foreground">
                      {instructor.name} 강사
                    </span>
                    {(instructor.agency || instructor.verified) && (
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        {instructor.agency && (
                          <Badge variant="outline" className="max-w-[130px] truncate px-2 py-0.5 text-[10px]">
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

            {isFull && instructor ? (
              <div className="space-y-2 pt-0.5">
                <span className="block text-base font-bold text-primary">
                  {formatKRW(applyPlatformFee(tour.basePrice))}~
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 w-full gap-1 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    setInquiryOpen(true);
                  }}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  강사에게 문의하기
                </Button>
              </div>
            ) : (
              <div className="pt-0.5 text-base font-bold text-primary">
                {formatKRW(applyPlatformFee(tour.basePrice))}~
              </div>
            )}
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
