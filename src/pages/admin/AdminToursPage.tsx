import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, ExternalLink, Lock, PlayCircle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { formatDateRangeKR } from "@/lib/dates";
import { formatKRW } from "@/lib/pricing";
import { CERTIFICATION_LABELS } from "@/lib/constants";
import { handleImageFallback } from "@/lib/image";
import type { Tour } from "@/types";

const ADMIN_STATUS_LABEL: Record<NonNullable<Tour["adminStatus"]>, string> = {
  suspended: "정지됨",
  held: "보류중",
};

interface TourStatusActionsProps {
  tour: Tour;
  bookingCount: number;
  onStatusChange: (tour: Tour, adminStatus: Tour["adminStatus"]) => void;
  onDelete: (tour: Tour, bookingCount: number) => void;
}

/** 정지/보류/재개/삭제 액션 버튼 묶음. 목록 카드와 상세 다이얼로그 양쪽에서 재사용한다. */
function TourStatusActions({ tour, bookingCount, onStatusChange, onDelete }: TourStatusActionsProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {tour.adminStatus ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs">
                <PlayCircle className="h-3.5 w-3.5" />
                재개
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>&quot;{tour.title}&quot; 투어를 다시 활성화하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  재개하면 다이버가 다시 이 투어를 검색하고 예약할 수 있게 됩니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={() => onStatusChange(tour, undefined)}>재개</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" className="flex-1 gap-1 text-xs">
                <Lock className="h-3.5 w-3.5" />
                정지
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>&quot;{tour.title}&quot; 투어를 정지시키겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  정지하면 검색 노출이 즉시 제거되고 신규 예약도 차단됩니다. 다시 정상화하려면 &quot;재개&quot;를,
                  완전히 없애려면 아래 &quot;투어 삭제&quot;를 사용하세요.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={() => onStatusChange(tour, "suspended")}>정지</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="ghost" className="w-full gap-1 text-xs text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
            투어 삭제
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>&quot;{tour.title}&quot; 투어를 완전히 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {bookingCount > 0
                ? `예약 기록이 ${bookingCount}건 있어 삭제할 수 없습니다. 정지 기능을 사용해주세요.`
                : "삭제하면 되돌릴 수 없습니다. 예약 기록이 있는 투어는 삭제 대신 정지를 사용해주세요."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction disabled={bookingCount > 0} onClick={() => onDelete(tour, bookingCount)}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** 모바일 폭에 맞춘 카드형 투어 목록 — 관리자가 투어를 확인하고 정지/보류/재개할 수 있다. */
const AdminToursPage = () => {
  const { tours, getInstructorById, bookings, setTourAdminStatus, deleteTour } = useAppData();
  const { toast } = useToast();
  const [detailTour, setDetailTour] = useState<Tour | null>(null);

  const handleAdminStatusChange = (tour: Tour, adminStatus: Tour["adminStatus"]) => {
    setTourAdminStatus(tour.id, adminStatus);
    if (adminStatus) {
      toast({ title: `"${tour.title}" 투어를 ${ADMIN_STATUS_LABEL[adminStatus]} 처리했습니다.` });
    } else {
      toast({ title: `"${tour.title}" 투어를 정상 상태로 재개했습니다.` });
    }
  };

  const handleDelete = (tour: Tour, bookingCount: number) => {
    if (bookingCount > 0) {
      toast({
        title: "삭제할 수 없어요",
        description: "예약 기록이 있는 투어는 삭제 대신 정지를 사용해주세요.",
        variant: "destructive",
      });
      return;
    }
    deleteTour(tour.id);
    toast({ title: `"${tour.title}" 투어를 삭제했습니다.` });
    setDetailTour(null);
  };

  const detailInstructor = detailTour ? getInstructorById(detailTour.instructorId) : undefined;
  const detailBookings = detailTour ? bookings.filter((b) => b.tourId === detailTour.id) : [];

  return (
    <div className="space-y-2">
      {tours.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">등록된 투어가 없습니다.</p>
      )}
      {tours.map((tour) => {
        const instructor = getInstructorById(tour.instructorId);
        const tourBookings = bookings.filter((b) => b.tourId === tour.id);
        const participantCount = tourBookings.filter((b) => b.status === "confirmed").length;
        return (
          <div key={tour.id} className="space-y-2 rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-1 text-sm font-semibold text-foreground">{tour.title}</p>
              <div className="flex shrink-0 gap-1">
                {tour.adminStatus && (
                  <Badge variant="destructive" className="text-[10px]">
                    {ADMIN_STATUS_LABEL[tour.adminStatus]}
                  </Badge>
                )}
                <Badge variant={tour.status === "open" ? "default" : "secondary"} className="text-[10px]">
                  {tour.status === "open" ? "모집중" : "마감"}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {tour.country} · {tour.site} · {formatDateRangeKR(tour.startDate, tour.endDate)}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span>담당 {instructor?.name ?? "-"}</span>
              <span>{CERTIFICATION_LABELS[tour.certificationLevel]}</span>
              <span>
                {participantCount}/{tour.maxParticipants}명
              </span>
            </div>
            <p className="text-sm font-semibold text-primary">{formatKRW(tour.basePrice)}</p>

            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1 text-xs"
              onClick={() => setDetailTour(tour)}
            >
              <Eye className="h-3.5 w-3.5" />
              투어 확인
            </Button>

            <TourStatusActions
              tour={tour}
              bookingCount={tourBookings.length}
              onStatusChange={handleAdminStatusChange}
              onDelete={handleDelete}
            />
          </div>
        );
      })}

      <Dialog open={!!detailTour} onOpenChange={(open) => !open && setDetailTour(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {detailTour && (
            <>
              <DialogHeader>
                <DialogTitle>{detailTour.title}</DialogTitle>
              </DialogHeader>
              <img
                src={detailTour.mainImageUrl}
                alt={detailTour.title}
                onError={handleImageFallback}
                className="h-40 w-full rounded-lg object-cover"
              />
              <div className="flex flex-wrap items-center gap-2">
                {detailTour.adminStatus && (
                  <Badge variant="destructive" className="text-[10px]">
                    {ADMIN_STATUS_LABEL[detailTour.adminStatus]}
                  </Badge>
                )}
                <Badge variant={detailTour.status === "open" ? "default" : "secondary"} className="text-[10px]">
                  {detailTour.status === "open" ? "모집중" : "마감"}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {CERTIFICATION_LABELS[detailTour.certificationLevel]}
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  {detailTour.country} · {detailTour.site} · {formatDateRangeKR(detailTour.startDate, detailTour.endDate)}
                </p>
                <p>담당 강사: {detailInstructor?.name ?? "-"}</p>
                <p>
                  예약 {detailBookings.filter((b) => b.status === "confirmed").length}/{detailTour.maxParticipants}명 ·
                  가격 {formatKRW(detailTour.basePrice)}
                </p>
                {detailTour.meetingPoint && <p>집합 장소: {detailTour.meetingPoint}</p>}
              </div>
              {detailTour.description && (
                <p className="whitespace-pre-line rounded-lg bg-secondary/50 p-3 text-xs text-foreground">
                  {detailTour.description}
                </p>
              )}
              {(detailTour.inclusions.length > 0 || detailTour.exclusions.length > 0) && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="mb-1 font-semibold text-foreground">포함</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      {detailTour.inclusions.map((i) => (
                        <li key={i}>· {i}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold text-foreground">불포함</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      {detailTour.exclusions.map((i) => (
                        <li key={i}>· {i}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <Button asChild size="sm" variant="ghost" className="w-full gap-1.5 text-xs">
                <Link to={`/tour/${detailTour.id}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  실제 투어 상세 페이지 새 탭에서 열기
                </Link>
              </Button>

              <TourStatusActions
                tour={detailTour}
                bookingCount={detailBookings.length}
                onStatusChange={(t, s) => {
                  handleAdminStatusChange(t, s);
                  setDetailTour({ ...t, adminStatus: s });
                }}
                onDelete={handleDelete}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminToursPage;
