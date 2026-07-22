import { Link } from "react-router-dom";
import { Eye, Lock, PauseCircle, PlayCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { formatDateRangeKR } from "@/lib/dates";
import { formatKRW } from "@/lib/pricing";
import { CERTIFICATION_LABELS } from "@/lib/constants";
import type { Tour } from "@/types";

const ADMIN_STATUS_LABEL: Record<NonNullable<Tour["adminStatus"]>, string> = {
  suspended: "정지됨",
  held: "보류중",
};

/** 모바일 폭에 맞춘 카드형 투어 목록 — 관리자가 투어를 확인하고 정지/보류/재개할 수 있다. */
const AdminToursPage = () => {
  const { tours, getInstructorById, bookings, setTourAdminStatus } = useAppData();
  const { toast } = useToast();

  const handleAdminStatusChange = (tour: Tour, adminStatus: Tour["adminStatus"]) => {
    setTourAdminStatus(tour.id, adminStatus);
    if (adminStatus) {
      toast({ title: `"${tour.title}" 투어를 ${ADMIN_STATUS_LABEL[adminStatus]} 처리했습니다.` });
    } else {
      toast({ title: `"${tour.title}" 투어를 정상 상태로 재개했습니다.` });
    }
  };

  return (
    <div className="space-y-2">
      {tours.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">등록된 투어가 없습니다.</p>
      )}
      {tours.map((tour) => {
        const instructor = getInstructorById(tour.instructorId);
        const participantCount = bookings.filter(
          (b) => b.tourId === tour.id && b.status === "confirmed",
        ).length;
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

            <div className="flex gap-1.5 pt-1">
              <Button asChild size="sm" variant="outline" className="flex-1 gap-1 text-xs">
                <Link to={`/tour/${tour.id}`} target="_blank" rel="noreferrer">
                  <Eye className="h-3.5 w-3.5" />
                  투어 확인
                </Link>
              </Button>

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
                      <AlertDialogAction onClick={() => handleAdminStatusChange(tour, undefined)}>
                        재개
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs">
                        <PauseCircle className="h-3.5 w-3.5" />
                        보류
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>&quot;{tour.title}&quot; 투어를 보류하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          보류하면 검토가 끝날 때까지 검색 노출과 신규 예약이 일시적으로 막힙니다. 언제든 다시 재개할 수 있습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleAdminStatusChange(tour, "held")}>
                          보류
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

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
                          정지하면 검색 노출이 즉시 제거되고 신규 예약도 차단됩니다. 이 작업은 나중에 다시 해제할 수 있습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleAdminStatusChange(tour, "suspended")}>
                          정지
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminToursPage;
