import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/tour/VerifiedBadge";
import { InstructorApplicationQueue } from "@/components/mypage/InstructorApplicationQueue";
import { useAppData } from "@/contexts/AppDataContext";

const AdminInstructorsPage = () => {
  const { instructors, tours } = useAppData();

  return (
    <div className="space-y-4">
      <Card className="accent-top-ocean">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>소속</TableHead>
                <TableHead>등록 투어</TableHead>
                <TableHead>평점</TableHead>
                <TableHead>패널티</TableHead>
                <TableHead>인증상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructors.map((instructor) => {
                const tourCount = tours.filter((t) => t.instructorId === instructor.id).length;
                return (
                  <TableRow key={instructor.id}>
                    <TableCell className="text-sm font-medium">{instructor.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{instructor.agency ?? "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{tourCount}개</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{instructor.rating.toFixed(1)}</TableCell>
                    <TableCell>
                      <Badge variant={instructor.penaltyCount > 0 ? "destructive" : "secondary"} className="text-[10px]">
                        {instructor.penaltyCount}회
                      </Badge>
                    </TableCell>
                    <TableCell>{instructor.verified ? <VerifiedBadge /> : <Badge variant="secondary" className="text-[10px]">심사중</Badge>}</TableCell>
                  </TableRow>
                );
              })}
              {instructors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    등록된 강사가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">강사 인증 신청 큐</h3>
        <InstructorApplicationQueue />
      </div>
    </div>
  );
};

export default AdminInstructorsPage;
