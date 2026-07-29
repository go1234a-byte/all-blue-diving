import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VerifiedBadge } from "@/components/tour/VerifiedBadge";
import { InstructorApplicationQueue } from "@/components/mypage/InstructorApplicationQueue";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { isPastDate } from "@/lib/dates";

/** 2회 경고 누적 시 자동으로 영구정지 처리한다 (setInstructorPenalty 내부 로직과 동일 기준). */
const PERMANENT_BAN_THRESHOLD = 2;

const AdminInstructorsPage = () => {
  const { instructors, tours, instructorProfiles, setInstructorPenalty, setProfileStatus, setInstructorVerified, setTourAdminStatus } =
    useAppData();
  const { toast } = useToast();
  // 강사별 "경고 부여" 사유 입력 임시 상태 (다이얼로그를 열어둔 강사 id를 key로 사용)
  const [warnReasonDrafts, setWarnReasonDrafts] = useState<Record<string, string>>({});
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "pending">("all");
  const [penaltyFilter, setPenaltyFilter] = useState<"all" | "has" | "none">("all");

  const filteredInstructors = instructors.filter((instructor) => {
    if (verifiedFilter === "verified" && !instructor.verified) return false;
    if (verifiedFilter === "pending" && instructor.verified) return false;
    if (penaltyFilter === "has" && instructor.penaltyCount <= 0) return false;
    if (penaltyFilter === "none" && instructor.penaltyCount > 0) return false;
    return true;
  });

  const handleRevokeVerified = (instructorId: string, instructorName: string) => {
    void setInstructorVerified(instructorId, false);
    toast({ title: `${instructorName} 강사의 인증을 회수했습니다.`, variant: "destructive" });
  };

  const handleWarn = (instructorId: string, instructorName: string, currentPenalty: number) => {
    const reason = warnReasonDrafts[instructorId]?.trim() || undefined;
    if (!reason) {
      toast({ title: "패널티 사유를 입력해주세요", variant: "destructive" });
      return;
    }
    const next = currentPenalty + 1;
    setInstructorPenalty(instructorId, next, reason);
    setWarnReasonDrafts((prev) => ({ ...prev, [instructorId]: "" }));
    if (next >= PERMANENT_BAN_THRESHOLD) {
      toast({
        title: `${instructorName} 강사에게 경고를 부여했습니다 (${next}회) — 영구정지 처리되었습니다.`,
        variant: "destructive",
      });
    } else {
      toast({ title: `${instructorName} 강사에게 경고를 부여했습니다 (${next}회).` });
    }
  };

  const handleClearWarning = (instructorId: string, instructorName: string) => {
    setInstructorPenalty(instructorId, 0);
    toast({ title: `${instructorName} 강사의 경고를 모두 해제했습니다.` });
  };

  const handlePermanentBan = (instructorId: string, instructorName: string, profileId: string) => {
    setInstructorPenalty(instructorId, PERMANENT_BAN_THRESHOLD);
    setProfileStatus(profileId, "suspended");
    // 영구정지 시 이 강사의 예정된(아직 끝나지 않은) 투어도 함께 정지 처리한다
    // (InstructorPublicProfile.tsx의 영구정지 플로우와 동일하게 맞춰서, 관리자 화면마다
    // 다르게 동작하던 문제를 없앤다).
    const upcomingTours = tours.filter((t) => t.instructorId === instructorId && !isPastDate(t.endDate));
    upcomingTours.forEach((t) => setTourAdminStatus(t.id, "suspended"));
    toast({
      title: `${instructorName} 강사를 영구정지 처리했습니다.${
        upcomingTours.length > 0 ? ` (예정된 투어 ${upcomingTours.length}건도 함께 정지)` : ""
      }`,
      variant: "destructive",
    });
  };

  const handleReinstate = (instructorId: string, instructorName: string, profileId: string) => {
    setInstructorPenalty(instructorId, 0);
    setProfileStatus(profileId, "active");
    toast({ title: `${instructorName} 강사의 영구정지를 해제했습니다.` });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-3">
        <Select value={verifiedFilter} onValueChange={(v) => setVerifiedFilter(v as typeof verifiedFilter)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 인증상태</SelectItem>
            <SelectItem value="verified">인증됨</SelectItem>
            <SelectItem value="pending">심사중</SelectItem>
          </SelectContent>
        </Select>
        <Select value={penaltyFilter} onValueChange={(v) => setPenaltyFilter(v as typeof penaltyFilter)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 패널티</SelectItem>
            <SelectItem value="has">경고 있음</SelectItem>
            <SelectItem value="none">경고 없음</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        {filteredInstructors.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">조건에 맞는 강사가 없습니다.</p>
        )}
        {filteredInstructors.map((instructor) => {
          const tourCount = tours.filter((t) => t.instructorId === instructor.id).length;
          const linkedProfile = instructorProfiles.find((p) => p.id === instructor.profileId);
          const isBanned = linkedProfile?.status === "suspended";
          return (
            <div key={instructor.id} className="space-y-2 rounded-xl border border-border bg-card p-3">
              <Link
                to={`/instructor/${instructor.id}/profile`}
                className="block space-y-1.5 transition-colors hover:opacity-80"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">{instructor.name}</p>
                    {instructor.verified ? (
                      <VerifiedBadge />
                    ) : (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        심사중
                      </Badge>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">{instructor.agency ?? "소속 없음"}</p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                  <span>등록 투어 {tourCount}개</span>
                  <span>평점 {instructor.rating.toFixed(1)}</span>
                  <Badge variant={instructor.penaltyCount > 0 ? "destructive" : "outline"} className="text-[10px]">
                    경고 {instructor.penaltyCount}회
                  </Badge>
                  {isBanned && (
                    <Badge variant="destructive" className="text-[10px]">
                      영구정지됨
                    </Badge>
                  )}
                </div>
              </Link>

              {isBanned ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      영구정지 해제
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{instructor.name} 강사의 영구정지를 해제하시겠습니까?</AlertDialogTitle>
                      <AlertDialogDescription>
                        해제하면 경고 횟수가 0회로 초기화되고 다시 정상적으로 활동할 수 있습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleReinstate(instructor.id, instructor.name, instructor.profileId)}
                      >
                        해제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <div className="flex gap-1.5">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        disabled={instructor.penaltyCount === 0}
                      >
                        경고 해제
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{instructor.name} 강사의 경고를 모두 해제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          누적된 경고 {instructor.penaltyCount}회가 0회로 초기화됩니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleClearWarning(instructor.id, instructor.name)}>
                          해제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="flex-1 text-xs">
                        경고 부여
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{instructor.name} 강사에게 경고를 주시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          경고 {PERMANENT_BAN_THRESHOLD}회 누적 시 자동으로 영구정지됩니다. 현재 누적 경고:{" "}
                          {instructor.penaltyCount}회
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <Textarea
                        placeholder="패널티 사유를 입력하세요 (강사 프로필에 함께 표시됩니다)"
                        value={warnReasonDrafts[instructor.id] ?? ""}
                        onChange={(e) =>
                          setWarnReasonDrafts((prev) => ({ ...prev, [instructor.id]: e.target.value }))
                        }
                        className="text-xs"
                      />
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                          disabled={!warnReasonDrafts[instructor.id]?.trim()}
                          onClick={() => handleWarn(instructor.id, instructor.name, instructor.penaltyCount)}
                        >
                          경고
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" className="flex-1 text-xs">
                        영구정지
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{instructor.name} 강사를 영구정지 시키겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          영구정지되면 해당 강사 계정은 즉시 서비스 이용이 제한됩니다. 나중에 다시 해제할 수 있습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handlePermanentBan(instructor.id, instructor.name, instructor.profileId)}
                        >
                          영구정지
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {instructor.verified && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="flex-1 text-xs">
                          인증 회수
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{instructor.name} 강사의 인증 배지를 회수하시겠습니까?</AlertDialogTitle>
                          <AlertDialogDescription>
                            인증이 회수되면 신규 투어 등록이 다시 제한되고, "심사중" 상태로 돌아갑니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRevokeVerified(instructor.id, instructor.name)}>
                            인증 회수
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">강사 인증 신청 큐</h3>
        <InstructorApplicationQueue />
      </div>
    </div>
  );
};

export default AdminInstructorsPage;
