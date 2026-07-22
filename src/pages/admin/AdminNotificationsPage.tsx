import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateKR } from "@/lib/dates";
import type { InstructorNotificationType } from "@/types";

const TYPE_LABEL: Record<InstructorNotificationType, string> = {
  new_booking: "신규 예약",
  forced_refund_penalty: "강제 환불 페널티",
  min_participants_cancelled: "최소인원 미달 자동취소",
  min_participants_proceed: "최소인원 미달 진행",
  min_participants_decision_needed: "최소인원 미달 결정 필요",
};

const AdminNotificationsPage = () => {
  const { instructorNotifications } = useAppData();
  const sorted = [...instructorNotifications].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <Card className="accent-top-ocean">
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>유형</TableHead>
              <TableHead>투어</TableHead>
              <TableHead>예약자</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead>읽음여부</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((n) => (
              <TableRow key={n.id}>
                <TableCell>
                  <Badge
                    variant={n.type === "new_booking" ? "secondary" : "destructive"}
                    className="text-[10px]"
                  >
                    {TYPE_LABEL[n.type]}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-sm">{n.tourTitle}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{n.diverName ?? "-"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDateKR(n.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant={n.read ? "outline" : "default"} className="text-[10px]">
                    {n.read ? "읽음" : "안읽음"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  알림 내역이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminNotificationsPage;
