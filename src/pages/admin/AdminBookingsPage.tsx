import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CancellationReviewQueue } from "@/components/admin/CancellationReviewQueue";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateKR } from "@/lib/dates";
import { formatKRW } from "@/lib/pricing";
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

/** 모바일 폭에 맞춘 카드형 예약 목록 — 기존 데스크톱 표 대신 사용한다. */
const AdminBookingsPage = () => {
  const { bookings, getTourById, getInstructorById } = useAppData();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const [query, setQuery] = useState("");

  const sorted = [...bookings].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = sorted.filter((booking) => {
    if (!normalizedQuery) return true;
    const tour = getTourById(booking.tourId);
    return (
      booking.diverName.toLowerCase().includes(normalizedQuery) ||
      (tour?.title ?? "").toLowerCase().includes(normalizedQuery) ||
      booking.id.toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <div className="space-y-4">
      <CancellationReviewQueue />
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="예약자명 / 투어명 / 예약ID로 검색"
          className="h-9 pl-8 text-xs"
        />
      </div>
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">조건에 맞는 예약이 없습니다.</p>
        )}
        {filtered.map((booking) => {
          const tour = getTourById(booking.tourId);
          const instructor = tour ? getInstructorById(tour.instructorId) : undefined;
          return (
            <div
              key={booking.id}
              className={`space-y-1.5 rounded-xl border p-3 ${
                booking.id === highlightId ? "border-primary bg-secondary/60" : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                {tour ? (
                  <Link
                    to={`/tour/${tour.id}`}
                    className="line-clamp-1 text-sm font-semibold text-foreground underline-offset-2 hover:underline"
                  >
                    {tour.title}
                  </Link>
                ) : (
                  <p className="line-clamp-1 text-sm font-semibold text-foreground">-</p>
                )}
                <Badge variant={STATUS_VARIANT[booking.status]} className="shrink-0 text-[10px]">
                  {STATUS_LABEL[booking.status]}
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">{booking.id}</p>
              <p className="text-xs text-muted-foreground">
                {booking.diverName} · {formatDateKR(booking.createdAt)}
              </p>
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {DEPOSIT_LABEL[booking.depositStatus]}
                </Badge>
                <span className="text-[11px] text-muted-foreground">담당 {instructor?.name ?? "-"}</span>
              </div>
              <p className="text-sm font-semibold text-primary">{formatKRW(booking.totalPaid)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminBookingsPage;
