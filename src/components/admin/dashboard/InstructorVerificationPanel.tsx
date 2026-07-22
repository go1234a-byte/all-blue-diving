import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";

/** 운영 모니터링 - 강사 인증 요청: 강사명/국가/신청일/자격상태/승인/반려. */
export function InstructorVerificationPanel() {
  const { instructors, setInstructorVerified, adminProfile } = useAppData();
  const navigate = useNavigate();
  const pending = instructors.filter((i) => !i.verified).slice(0, 5);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await setInstructorVerified(id, true, adminProfile.id);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <Card className="accent-top-ocean">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" />
          강사 인증 요청
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => navigate("/admin/instructors")}>
          전체보기
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {pending.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">대기중인 인증 요청이 없습니다.</p>
        ) : (
          pending.map((instructor) => (
            <div key={instructor.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{instructor.name}</p>
                <p className="text-[11px] text-muted-foreground">{instructor.agency ?? "자격 미기재"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px]">심사중</Badge>
                <Button
                  size="sm"
                  className="h-6 gap-1 px-2 text-[10px]"
                  disabled={approvingId === instructor.id}
                  onClick={() => handleApprove(instructor.id)}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  승인
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
