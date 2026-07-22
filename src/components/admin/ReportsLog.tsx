import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReviewModerationQueue } from "@/components/admin/ReviewModerationQueue";
import { useAppData } from "@/contexts/AppDataContext";

export function ReportsLog() {
  const { reports, resolveReport } = useAppData();

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>대상</TableHead>
              <TableHead>위반 유형</TableHead>
              <TableHead>상세 내용</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">처리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">
                  {report.targetName}
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({report.targetType === "instructor" ? "강사" : "다이버"})
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{report.violationType}</Badge>
                </TableCell>
                <TableCell className="max-w-[280px] truncate text-muted-foreground">{report.description}</TableCell>
                <TableCell>
                  <Badge variant={report.status === "pending" ? "secondary" : "default"}>
                    {report.status === "pending" ? "처리 대기" : "처리 완료"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={report.status === "resolved"}
                    onClick={() => resolveReport(report.id)}
                  >
                    처리 완료 표시
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {reports.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  접수된 신고가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">신고된 후기 관리</h3>
        <ReviewModerationQueue />
      </div>
    </div>
  );
}
