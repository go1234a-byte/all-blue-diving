import { useState } from "react";
import { CheckCircle2, FileText, XCircle } from "lucide-react";
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
import { getInstructorDocumentSignedUrl } from "@/lib/uploadImage";
import { maskName } from "@/lib/masking";

/**
 * 서류 1건을 "보기" 버튼으로 노출한다. 파일은 비공개 버킷(instructor-documents)에 있어서
 * 미리 URL을 만들어둘 수 없고, 누른 시점에 서명된 임시 URL을 발급받아 새 탭으로 연다
 * (본인 또는 관리자만 발급 성공 — storage RLS가 서명 URL 발급 자체를 막는다).
 */
function DocumentViewButton({ path, label }: { path?: string | null; label: string }) {
  const [loading, setLoading] = useState(false);

  if (!path) {
    return (
      <span className="rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground">
        {label} 미제출
      </span>
    );
  }

  const handleClick = async () => {
    setLoading(true);
    const url = await getInstructorDocumentSignedUrl(path);
    setLoading(false);
    if (!url) {
      alert(`${label} 파일을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.`);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-7 gap-1 text-[11px]"
      onClick={handleClick}
      disabled={loading}
    >
      <FileText className="h-3 w-3" />
      {loading ? "불러오는 중..." : `${label} 보기`}
    </Button>
  );
}

/**
 * 관리자용 강사 인증 신청 큐. `verified_status = false`이고 아직 반려되지 않은 강사를
 * 나열하고, "인증 승인" 또는 "반려" 처리를 할 수 있다.
 * (예전에는 반려 기능 자체가 없어서 대기열에 들어간 강사를 승인하거나 영구히 방치하는
 * 것 외에 관리자가 취할 수 있는 조치가 없었다.)
 */
export function InstructorApplicationQueue() {
  const { instructors, getInstructorProfileById, setInstructorVerified, rejectInstructorApplication, adminProfile } =
    useAppData();
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
      {pending.map((instructor) => {
        const profile = getInstructorProfileById(instructor.profileId);
        // 예전에는 신분증/자격증/통장사본을 실제로 서버에 업로드하지 않고 파일명만
        // 저장해서, 이 큐를 아무리 열어봐도 관리자가 실제 서류를 확인할 방법이 없었다
        // (#부적절 인증 회귀 방지). 지금부터 가입하는 강사는 실제 파일이 저장되지만,
        // 이 수정 이전에 이미 접수된 신청 건은 원본 파일이 애초에 저장된 적이 없어
        // "제출 서류 없음"으로 뜬다 — 그런 경우는 서류 확인 없이는 승인하지 말고
        // 별도로 본인 확인 후 처리해야 한다.
        const hasAnyDocument = Boolean(
          instructor.licenseFilePaths?.length || profile?.idDocumentPath || profile?.bankbookPath,
        );
        return (
          <Card key={instructor.id}>
            <CardContent className="space-y-3 p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={instructor.avatarUrl} alt={instructor.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {maskName(instructor.name)[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{instructor.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{profile?.phone || "연락처 미확인"}</p>
                  {instructor.pledgeSigned && (
                    <p className="text-[10px] font-medium text-success">전자서약 완료</p>
                  )}
                </div>
                <Badge variant="secondary" className="shrink-0">
                  심사 대기
                </Badge>
              </div>

              <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-2.5">
                <p className="text-[11px] font-semibold text-foreground">제출 서류</p>
                {!hasAnyDocument && (
                  <p className="text-[11px] text-destructive">
                    이 신청 건은 서류 원본이 저장되지 않았습니다(가입 당시 시스템 문제). 서류
                    확인 없이 승인하지 말고 별도로 본인 확인 후 처리해주세요.
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  <DocumentViewButton path={profile?.idDocumentPath} label="신분증 사본" />
                  {(instructor.licenseFilePaths?.length ? instructor.licenseFilePaths : [undefined]).map(
                    (path, idx) => (
                      <DocumentViewButton
                        key={path ?? idx}
                        path={path}
                        label={
                          (instructor.licenseFilePaths?.length ?? 0) > 1 ? `자격증 서류 ${idx + 1}` : "자격증 서류"
                        }
                      />
                    ),
                  )}
                  <DocumentViewButton path={profile?.bankbookPath} label="통장 사본" />
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  <span>은행: {profile?.bankName || "-"}</span>
                  <span>예금주: {profile?.accountHolder || "-"}</span>
                  <span className="col-span-2">계좌번호: {profile?.accountNumber || "-"}</span>
                </div>
                {instructor.signatureDataUrl && (
                  <div className="space-y-1">
                    <p className="text-[11px] text-muted-foreground">전자서명</p>
                    <img
                      src={instructor.signatureDataUrl}
                      alt="전자서명"
                      className="h-16 w-auto rounded border border-border bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => handleApprove(instructor.id)}
                  disabled={approvingId === instructor.id}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  인증 승인
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1 text-destructive hover:text-destructive"
                  onClick={() => openReject(instructor.id)}
                  disabled={approvingId === instructor.id}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  반려
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

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
