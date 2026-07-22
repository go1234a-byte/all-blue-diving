import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateRangeKR } from "@/lib/dates";
import { formatKRW } from "@/lib/pricing";
import { CERTIFICATION_LABELS } from "@/lib/constants";

const AdminToursPage = () => {
  const { tours, getInstructorById, bookings } = useAppData();

  return (
    <Card className="accent-top-ocean">
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>투어명</TableHead>
              <TableHead>국가/사이트</TableHead>
              <TableHead>강사</TableHead>
              <TableHead>일정</TableHead>
              <TableHead>인증등급</TableHead>
              <TableHead className="text-right">기본가</TableHead>
              <TableHead>참가자</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tours.map((tour) => {
              const instructor = getInstructorById(tour.instructorId);
              const participantCount = bookings.filter(
                (b) => b.tourId === tour.id && b.status === "confirmed",
              ).length;
              return (
                <TableRow key={tour.id}>
                  <TableCell className="max-w-[200px] truncate text-sm font-medium">{tour.title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {tour.country} · {tour.site}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{instructor?.name ?? "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateRangeKR(tour.startDate, tour.endDate)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {CERTIFICATION_LABELS[tour.certificationLevel]}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold text-primary">
                    {formatKRW(tour.basePrice)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {participantCount}/{tour.maxParticipants}명
                  </TableCell>
                  <TableCell>
                    <Badge variant={tour.status === "open" ? "default" : "secondary"} className="text-[10px]">
                      {tour.status === "open" ? "모집중" : "마감"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {tours.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                  등록된 투어가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminToursPage;
