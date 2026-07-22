import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppData } from "@/contexts/AppDataContext";
import { maskName } from "@/lib/masking";

/**
 * 관리자용 강사 인증 신청 큐. `verified_status = false`인 강사를 나열하고,
 * "인증 승인" 클릭 시 Enter Cloud(Supabase) instructors.verified_status를 true로 업데이트한다.
 */
export function InstructorApplicationQueue() {
  const { instructors, setInstructorVerified, adminProfile } = useAppData();
  const pending = instructors.filter((i) => !i.verified);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await setInstructorVerified(id, true, adminProfile.id);
    } finally {
      setApprovingId(null);
    }
  };

  if (pending.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">대기중인 강사 인증 신청이 없습니다.</p>
    );
  }

  return (
    <div className="space-y-2">
      {pending.map((instructor) => (
        <Card key={instructor.id}>
          <CardContent className="flex items-center gap-3 p-3">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src={instructor.avatarUrl} alt={instructor.name} crossOrigin="anonymous" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {maskName(instructor.name)[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{instructor.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {instructor.licenseFileNames.join(", ") || "제출 서류 없음"}
              </p>
              {instructor.pledgeSigned && (
                <p className="text-[10px] font-medium text-success">전자서약 완료</p>
              )}
            </div>
            <Badge variant="secondary" className="shrink-0">
              심사 대기
            </Badge>
            <Button
              size="sm"
              className="shrink-0 gap-1"
              onClick={() => handleApprove(instructor.id)}
              disabled={approvingId === instructor.id}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              인증 승인
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
