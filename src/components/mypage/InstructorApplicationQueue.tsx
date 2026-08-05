import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { maskName } from "@/lib/masking";

/**
 * 관리자용 강사 인증 신청 큐. `verified_status = false`이고 아직 반려되지 않은 강사를
 * 나열하고, "인증 승인" 또는 "반려" 처리를 할 수 있다.
 * (예전에는 반려 기능 자체가 없어서 대기열에 들어간 강사를 승인하거나 영구히 방치하는
 * 것 외에 관리자가 취할 수 있는 조치가 없었다.)
 */
export function InstructorApplicationQueue() {
  const { instructors, setInstructorVerified, rejectInstructorApplication, adminProfile } = useAppData();
  const { toast } = useToast();
  const pending = instructors.filter((i) => !i.verified && !i.rejectedAt);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await setInstructorVerified(id, true, adminProfile.id);
      toast({ title: "강사 인증을 승인했습니다." });
    } finally {
      setApprovingId(null);
    }
  };

  const openReject = (id: string) => {
    setRejectingId(id);
    setRejectReason("");
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast({ title: "반려 사유를 입력해주세요", variant: "destructive" });
      return;
    }
    setSubmittingReject(true);
    try {
      await rejectInstructorApplication(rejectingId, reason, adminProfile.id);
      toast({ title: "강사 인증 신청을 반려했습니다." });
      setRejectingId(null);
    } catch (err) {
      toast({
        title: "반려 처리에 실패했습니다",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSubmittingReject(false);
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
              <AvatarImage src={instructor.avatarUrl} alt={instructor.name} />
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
            <div className="flex shrink-0 flex-col gap-1">
              <Button
                size="sm"
                className="gap-1"
                onClick={() => handleApprove(instructor.id)}
                disabled={approvingId === instructor.id}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                인증 승인
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-destructive hover:text-destructive"
                onClick={() => openReject(instructor.id)}
                disabled={approvingId === instructor.id}
              >
                <XCircle className="h-3.5 w-3.5" />
                반려
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>강사 인증 신청 반려</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>반려 사유 (강사 본인에게 알림으로 전달됩니다)</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="예: 제출된 자격증 사본이 식별되지 않습니다. 선명한 이미지로 다시 제출해주세요."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)} disabled={submittingReject}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={submittingReject}>
              {submittingReject ? "처리 중..." : "반려 확정"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
