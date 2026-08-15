import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  ExternalLink,
  LayoutDashboard,
  Lock,
  MessageCircle,
  Minus,
  PlayCircle,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CancelBookingDialog } from "@/components/mypage/CancelBookingDialog";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { formatDateRangeKR, isPastDate } from "@/lib/dates";
import { formatKRW } from "@/lib/pricing";
import { CERTIFICATION_LABELS } from "@/lib/constants";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";
import type { Booking, Tour } from "@/types";

const ADMIN_STATUS_LABEL: Record<NonNullable<Tour["adminStatus"]>, string> = {
  suspended: "정지됨",
  held: "보류중",
};

interface TourStatusActionsProps {
  tour: Tour;
  bookingCount: number;
  confirmedCount: number;
  onStatusChange: (tour: Tour, adminStatus: Tour["adminStatus"]) => void;
  onDelete: (tour: Tour, bookingCount: number) => void;
}

/** 정지/보류/재개/삭제 액션 버튼 묶음. 목록 카드와 상세 다이얼로그 양쪽에서 재사용한다. */
function TourStatusActions({ tour, bookingCount, confirmedCount, onStatusChange, onDelete }: TourStatusActionsProps) {
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
                  정지하면 검색 노출이 즉시 제거되고 신규 예약도 차단됩니다.
                  {confirmedCount > 0
                    ? ` 이미 확정된 예약 ${confirmedCount}건은 전액 환불 처리되어 취소됩니다.`
                    : ""}{" "}
                  다시 정상화하려면 &quot;재개&quot;를, 완전히 없애려면 아래 &quot;투어 삭제&quot;를 사용하세요.
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
  const {
    tours,
    getInstructorById,
    bookings,
    setTourAdminStatus,
    forceCancelTourBookings,
    deleteTour,
    getConfirmedParticipantCount,
    updateTour,
  } = useAppData();
  const { toast } = useToast();
  const [detailTour, setDetailTour] = useState<Tour | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed" | "completed" | "suspended" | "held">(
    "all",
  );
  const [adjustingCapacityId, setAdjustingCapacityId] = useState<string | null>(null);
  const [adjustingHeadcountId, setAdjustingHeadcountId] = useState<string | null>(null);

  // 관리자 전용 — 강사가 정원 조정을 문의해 왔을 때, 예약이 있어 강사 본인은 못 바꾸는
  // 최대 인원(정원)을 관리자가 여기서 직접 +/- 로 조정한다. 확정+수동 인원 아래로는 못
  // 내려가게 막는다. 상세 다이얼로그는 별도 로컬 스냅샷(detailTour)이라 여기서 바꾼 값이
  // 자동 반영되지 않는다(기존 정지/보류 액션도 같은 이유로 setDetailTour를 직접 갱신한다)
  // — 그래서 실제로 적용된 값을 반환해 호출부가 필요하면 detailTour도 같이 갱신할 수 있게 한다.
  const handleAdjustCapacity = async (tour: Tour, delta: number): Promise<number | undefined> => {
    const confirmedCount = getConfirmedParticipantCount(tour.id);
    const next = tour.maxParticipants + delta;
    if (next < 1 || next < confirmedCount) return undefined;
    setAdjustingCapacityId(tour.id);
    try {
      await updateTour(tour.id, { maxParticipants: next });
      toast({ title: `"${tour.title}" 정원을 ${next}명으로 변경했습니다.` });
      return next;
    } catch (err) {
      toast({
        title: "정원 변경에 실패했습니다",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
      return undefined;
    } finally {
      setAdjustingCapacityId(null);
    }
  };

  // 관리자 전용 — 전화/현장 접수 등 앱을 거치지 않은 참가자를 "현재인원"에 반영한다. 실제
  // bookings row를 만들지 않는 수동 카운트라, 정원(max_participants)을 넘지 못하게만 막고
  // (실 예약을 취소하는 게 아니므로) 0 밑으로도 못 내려가게 막는다.
  const handleAdjustHeadcount = async (tour: Tour, delta: number): Promise<number | undefined> => {
    const next = tour.manualParticipantCount + delta;
    if (next < 0) return undefined;
    const confirmedCount = getConfirmedParticipantCount(tour.id);
    if (delta > 0 && confirmedCount >= tour.maxParticipants) return undefined;
    setAdjustingHeadcountId(tour.id);
    try {
      await updateTour(tour.id, { manualParticipantCount: next });
      toast({ title: `"${tour.title}" 현재인원(수동 추가분)을 ${next}명으로 변경했습니다.` });
      return next;
    } catch (err) {
      toast({
        title: "현재인원 변경에 실패했습니다",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
      return undefined;
    } finally {
      setAdjustingHeadcountId(null);
    }
  };

  // "종료(진행완료)"는 tours.status 값이 아니라, 강사 마이페이지(InstructorMyPageView.tsx)와
  // 동일한 기준(마감 처리됐거나 출발 종료일이 이미 지남)으로 계산하는 파생 상태다. 예전에는
  // 관리자 화면에 실제로 투어가 끝났는지 확인할 방법이 없어 "마감(모집 종료)"과 "종료(진행
  // 완료)"를 구분할 수 없었다.
  const filteredTours = tours.filter((tour) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "suspended" || statusFilter === "held") return tour.adminStatus === statusFilter;
    if (statusFilter === "completed") {
      return !tour.adminStatus && (tour.status === "closed" || isPastDate(tour.endDate));
    }
    return !tour.adminStatus && tour.status === statusFilter;
  });

  const handleAdminStatusChange = async (tour: Tour, adminStatus: Tour["adminStatus"]) => {
    try {
      await setTourAdminStatus(tour.id, adminStatus);
      if (adminStatus === "suspended") {
        const cancelledCount = await forceCancelTourBookings(tour.id);
        toast({
          title: `"${tour.title}" 투어를 정지 처리했습니다.${
            cancelledCount > 0 ? ` 확정 예약 ${cancelledCount}건을 전액 환불 취소했습니다.` : ""
          }`,
        });
      } else if (adminStatus) {
        toast({ title: `"${tour.title}" 투어를 ${ADMIN_STATUS_LABEL[adminStatus]} 처리했습니다.` });
      } else {
        toast({ title: `"${tour.title}" 투어를 정상 상태로 재개했습니다.` });
      }
    } catch (err) {
      toast({
        title: "투어 상태 변경에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
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
      <div className="rounded-xl border border-border bg-card p-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="open">모집중</SelectItem>
            <SelectItem value="closed">마감</SelectItem>
            <SelectItem value="completed">종료(진행완료)</SelectItem>
            <SelectItem value="suspended">정지됨</SelectItem>
            <SelectItem value="held">보류중</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {filteredTours.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">조건에 맞는 투어가 없습니다.</p>
      )}
      {filteredTours.map((tour) => {
        const instructor = getInstructorById(tour.instructorId);
        const tourBookings = bookings.filter((b) => b.tourId === tour.id);
        // 관리자는 RLS상 모든 예약을 볼 수 있어 원래도 정확했지만, 다른 화면들과 계산 방식을
        // 하나로 통일해두기 위해 여기서도 공개 집계 뷰 기반 헬퍼를 쓴다.
        const participantCount = getConfirmedParticipantCount(tour.id);
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
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>현재인원</span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-5 w-5"
                  disabled={adjustingHeadcountId === tour.id || tour.manualParticipantCount <= 0}
                  onClick={() => handleAdjustHeadcount(tour, -1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="min-w-[3rem] text-center font-medium text-foreground">
                  {participantCount}/{tour.maxParticipants}명
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-5 w-5"
                  disabled={adjustingHeadcountId === tour.id || participantCount >= tour.maxParticipants}
                  onClick={() => handleAdjustHeadcount(tour, 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <span>정원</span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-5 w-5"
                  disabled={adjustingCapacityId === tour.id || tour.maxParticipants <= participantCount}
                  onClick={() => handleAdjustCapacity(tour, -1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="min-w-[1.5rem] text-center font-medium text-foreground">{tour.maxParticipants}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-5 w-5"
                  disabled={adjustingCapacityId === tour.id}
                  onClick={() => handleAdjustCapacity(tour, 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
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
              confirmedCount={participantCount}
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
                src={detailTour.mainImageUrl || IMAGE_PLACEHOLDER}
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
                <div className="flex flex-wrap items-center gap-1.5">
                  <span>현재인원</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-5 w-5"
                    disabled={adjustingHeadcountId === detailTour.id || detailTour.manualParticipantCount <= 0}
                    onClick={async () => {
                      const applied = await handleAdjustHeadcount(detailTour, -1);
                      if (applied !== undefined) setDetailTour({ ...detailTour, manualParticipantCount: applied });
                    }}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="min-w-[3rem] text-center">
                    {getConfirmedParticipantCount(detailTour.id)}/{detailTour.maxParticipants}명
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-5 w-5"
                    disabled={
                      adjustingHeadcountId === detailTour.id ||
                      getConfirmedParticipantCount(detailTour.id) >= detailTour.maxParticipants
                    }
                    onClick={async () => {
                      const applied = await handleAdjustHeadcount(detailTour, 1);
                      if (applied !== undefined) setDetailTour({ ...detailTour, manualParticipantCount: applied });
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span>정원</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-5 w-5"
                    disabled={
                      adjustingCapacityId === detailTour.id ||
                      detailTour.maxParticipants <= getConfirmedParticipantCount(detailTour.id)
                    }
                    onClick={async () => {
                      const applied = await handleAdjustCapacity(detailTour, -1);
                      if (applied !== undefined) setDetailTour({ ...detailTour, maxParticipants: applied });
                    }}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="min-w-[1.5rem] text-center">{detailTour.maxParticipants}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-5 w-5"
                    disabled={adjustingCapacityId === detailTour.id}
                    onClick={async () => {
                      const applied = await handleAdjustCapacity(detailTour, 1);
                      if (applied !== undefined) setDetailTour({ ...detailTour, maxParticipants: applied });
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <span>· 가격 {formatKRW(detailTour.basePrice)}</span>
                </div>
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

              <div className="grid grid-cols-2 gap-1.5">
                <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
                  <Link to={`/chat/${detailTour.id}`}>
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    투어 대시보드 보기
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
                  <Link to={`/chat/${detailTour.id}?view=chat`}>
                    <MessageCircle className="h-3.5 w-3.5" />
                    채팅방 보기
                  </Link>
                </Button>
              </div>
              <Button asChild size="sm" variant="ghost" className="w-full gap-1.5 text-xs">
                <Link to={`/tour/${detailTour.id}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  실제 투어 상세 페이지 새 탭에서 열기
                </Link>
              </Button>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-foreground">
                  참가자 목록 ({detailBookings.filter((b) => b.status !== "cancelled").length}명)
                </p>
                {detailBookings.filter((b) => b.status !== "cancelled").length === 0 ? (
                  <p className="text-xs text-muted-foreground">참가자가 없습니다.</p>
                ) : (
                  <div className="space-y-1.5">
                    {detailBookings
                      .filter((b) => b.status !== "cancelled")
                      .map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border px-2.5 py-1.5 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{booking.diverName}</p>
                            <p className="text-muted-foreground">
                              {booking.status === "confirmed" ? "예약 확정" : "취소 검토중"}
                              {booking.roomNo ? ` · ${booking.roomNo}호실` : ""}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 shrink-0 gap-1 px-2 text-[11px] text-destructive hover:text-destructive"
                            onClick={() => setCancelTarget(booking)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            예약 취소
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <TourStatusActions
                tour={detailTour}
                bookingCount={detailBookings.length}
                confirmedCount={detailTour ? getConfirmedParticipantCount(detailTour.id) : 0}
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

      {detailTour && cancelTarget && (
        <CancelBookingDialog
          open={!!cancelTarget}
          onOpenChange={(open) => !open && setCancelTarget(null)}
          booking={cancelTarget}
          tour={detailTour}
        />
      )}
    </div>
  );
};

export default AdminToursPage;
