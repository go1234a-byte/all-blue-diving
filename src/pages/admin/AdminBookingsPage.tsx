import { useSearchParams } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CancellationReviewQueue } from "@/components/admin/CancellationReviewQueue";
import { useAppData } from "@/contexts/AppDataContext";
import { maskName } from "@/lib/masking";
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

const AdminBookingsPage = () => {
  const { bookings, getTourById, getInstructorById } = useAppData();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const sorted = [...bookings].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="space-y-4">
      <CancellationReviewQueue />
      <Card className="accent-top-ocean">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>예약번호</TableHead>
                <TableHead>투어명</TableHead>
                <TableHead>예약자</TableHead>
                <TableHead>예약일</TableHead>
                <TableHead className="text-right">결제금액</TableHead>
                <TableHead>결제상태</TableHead>
                <TableHead>예약상태</TableHead>
                <TableHead>강사</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((booking) => {
                const tour = getTourById(booking.tourId);
                const instructor = tour ? getInstructorById(tour.instructorId) : undefined;
                return (
                  <TableRow
                    key={booking.id}
                    className={booking.id === highlightId ? "bg-secondary/60" : undefined}
                  >
                    <TableCell className="font-mono text-xs">{booking.id}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{tour?.title ?? "-"}</TableCell>
                    <TableCell className="text-sm">{maskName(booking.diverName)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateKR(booking.createdAt)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold text-primary">
                      {formatKRW(booking.totalPaid)}
                    </TableCell>
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
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    예약 내역이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookingsPage;
