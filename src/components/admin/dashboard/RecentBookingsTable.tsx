import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppData } from "@/contexts/AppDataContext";
import { maskName } from "@/lib/masking";
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
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>예약번호</TableHead>
              <TableHead>투어명</TableHead>
              <TableHead>예약자</TableHead>
              <TableHead>예약일</TableHead>
              <TableHead>결제상태</TableHead>
              <TableHead>예약상태</TableHead>
              <TableHead>강사</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((booking) => {
              const tour = getTourById(booking.tourId);
              const instructor = tour ? getInstructorById(tour.instructorId) : undefined;
              return (
                <TableRow
                  key={booking.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/bookings?highlight=${booking.id}`)}
                >
                  <TableCell className="font-mono text-xs">{booking.id}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-sm">{tour?.title ?? "-"}</TableCell>
                  <TableCell className="text-sm">{maskName(booking.diverName)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateKR(booking.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {DEPOSIT_LABEL[booking.depositStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[booking.status]} className="text-[10px]">
                      {STATUS_LABEL[booking.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{instructor?.name ?? "-"}</TableCell>
                </TableRow>
              );
            })}
            {recent.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  예약 내역이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
