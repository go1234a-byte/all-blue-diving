import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateKR } from "@/lib/dates";
import type { BookingStatus, DepositStatus } from "@/types";

const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: "예약확정",
  cancelled: "취소됨",
  cancel_pending_review: "취소 심사중",
};

const STATUS_VARIANT: Record<BookingStatus, "default" | "destructive" | "secondary"> = {
  confirmed: "default",
  cancelled: "destructive",
  cancel_pending_review: "secondary",
};

const DEPOSIT_LABEL: Record<DepositStatus, string> = {
  paid: "결제완료",
  pending: "결제대기",
};

interface RecentBookingsTableProps {
  limit?: number;
}

/** Dashboard 최근 예약 테이블 — 예약번호/투어명/예약자/예약일/결제상태/예약상태/강사. */
export function RecentBookingsTable({ limit = 10 }: RecentBookingsTableProps) {
  const { bookings, getTourById, getInstructorById } = useAppData();
  const navigate = useNavigate();
  const recent = [...bookings].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, limit);

  return (
    <Card className="accent-top-ocean">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold">최근 예약</CardTitle>
        <Button size="sm" variant="outline" onClick={() => navigate("/admin/bookings")}>
          전체보기
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-1">
        {recent.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">예약 내역이 없습니다.</p>
        )}
        {recent.map((booking) => {
          const tour = getTourById(booking.tourId);
          const instructor = tour ? getInstructorById(tour.instructorId) : undefined;
          return (
            <button
              key={booking.id}
              type="button"
              onClick={() => navigate(`/admin/bookings?highlight=${booking.id}`)}
              className="w-full space-y-1.5 rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-1 text-sm font-semibold text-foreground">{tour?.title ?? "-"}</p>
                <Badge variant={STATUS_VARIANT[booking.status]} className="shrink-0 text-[10px]">
                  {STATUS_LABEL[booking.status]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {booking.diverName} · {formatDateKR(booking.createdAt)}
              </p>
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {DEPOSIT_LABEL[booking.depositStatus]}
                </Badge>
                <span className="text-[11px] text-muted-foreground">담당 {instructor?.name ?? "-"}</span>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
