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
import { isPastDate, isWithinAdminPeriod } from "@/lib/dates";
import { useAdminPeriod } from "@/contexts/AdminPeriodContext";

/** '영구정지' 버튼으로 즉시 계정을 정지할 때 함께 기록되는 경고 횟수 값 (기록용, 실제 정지는
 * profiles.status 변경 + 투어 정지로 처리됨). */
const PERMANENT_BAN_THRESHOLD = 2;

/** 경고 누적이 이 값 이상이면 신규 투어 생성 기능이 제한된다 (InstructorConsole.tsx와 동일
 * 기준). 계정 자체는 정지되지 않는다 — 즉시 정지하려면 '영구정지' 버튼을 사용한다. */
const FEATURE_RESTRICTION_THRESHOLD = 5;

const AdminInstructorsPage = () => {
  const {
    instructors,
    tours,
    instructorProfiles,
    penalties,
    setInstructorPenalty,
    voidPenalty,
    setProfileStatus,
    setInstructorVerified,
    setTourAdminStatus,
  } = useAppData();
  const { toast } = useToast();
  // 강사별 "경고 부여" 사유 입력 임시 상태 (다이얼로그를 열어둔 강사 id를 key로 사용)
  const [warnReasonDrafts, setWarnReasonDrafts] = useState<Record<string, string>>({});
  // 패널티 이력 펼침 상태 (id를 key로 사용)
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [voidingPenaltyId, setVoidingPenaltyId] = useState<string | null>(null);

  const handleVoidPenalty = async (penaltyId: string, instructorId: string) => {
    setVoidingPenaltyId(penaltyId);
    try {
      await voidPenalty(penaltyId, instructorId);
      toast({ title: "해당 패널티 이력을 정정(취소)했습니다." });
    } catch (err) {
      toast({
        title: "정정 처리 실패",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setVoidingPenaltyId(null);
    }
  };
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "pending">("all");
  const [penaltyFilter, setPenaltyFilter] = useState<"all" | "has" | "none">("all");
  const [sortOrder, setSortOrder] = useState<"default" | "latest">("default");
  // 상단바의 기간(오늘/이번주/이번달/올해) 선택 — 예전에는 이 값을 어떤 관리자 화면도
  // 실제로 소비하지 않아서 선택해도 목록이 그대로였다. 여기서는 강사 가입(신청)일 기준으로 필터링한다.
  const { period } = useAdminPeriod();

  const filteredInstructors = instructors
    .filter((instructor) => {
      if (verifiedFilter === "verified" && !instructor.verified) return false;
      if (verifiedFilter === "pending" && instructor.verified) return false;
      if (penaltyFilter === "has" && instructor.penaltyCount <= 0) return false;
      if (penaltyFilter === "none" && instructor.penaltyCount > 0) return false;
      if (!isWithinAdminPeriod(instructor.createdAt, period)) return false;
      return true;
    })
    .sort((a, b) => {
      // 심사 대기중(미인증·미반려)인 강사는 정렬 조건과 무관하게 항상 맨 위로 올린다.
      // 예전에는 새로 가입한 강사가 목록 맨 뒤에 추가되는 구조라, 승인이 시급한 신청
      // 건이 전체 강사 목록 맨 아래에 파묻혀 관리자가 놓치기 쉬웠다.
      const aPending = !a.verified && !a.rejectedAt;
      const bPending = !b.verified && !b.rejectedAt;
      if (aPending !== bPending) return aPending ? -1 : 1;
      if (sortOrder !== "latest") return 0;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
    if (next >= FEATURE_RESTRICTION_THRESHOLD) {
      toast({
        title: `${instructorName} 강사에게 경고를 부여했습니다 (${next}회) — 신규 투어 생성 기능이 제한됩니다.`,
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
      {/* 예전에는 이 승인 대기열이 전체 강사 목록 맨 아래에 있어서, 관리자가 승인/반려
          처리를 하려면 등록된 모든 강사(인증됨/반려됨/정지됨 포함)를 다 스크롤해서
          지나가야 했다. 가장 시급하게 처리해야 할 "심사 대기중" 건을 페이지 맨 위로
          올린다. */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">강사 인증 신청 큐 (심사 대기중)</h3>
        <InstructorApplicationQueue />
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-card p-3">
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
        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">기본순</SelectItem>
            <SelectItem value="latest">최신순</SelectItem>
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
                    ) : instructor.rejectedAt ? (
                      <Badge variant="destructive" className="shrink-0 text-[10px]">
                        반려됨
                      </Badge>
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
                          경고 {FEATURE_RESTRICTION_THRESHOLD}회 누적 시 신규 투어 생성 기능이 제한됩니다 (계정 정지는 아닙니다). 현재 누적 경고:{" "}
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

              {/*
                예전에는 penalties_log에 이력이 쌓이기만 하고 관리자 화면 어디에서도
                특정 강사의 누적 이력을 조회할 방법이 없었다(#228 회귀 방지). 특정 건만
                정정(취소)할 수도 없어서 "경고 해제"로 전체를 초기화하는 것 외엔 방법이
                없었다(#229 회귀 방지).
              */}
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-xs text-muted-foreground"
                onClick={() => setExpandedHistoryId(expandedHistoryId === instructor.id ? null : instructor.id)}
              >
                패널티 이력 {expandedHistoryId === instructor.id ? "숨기기" : "보기"}
              </Button>
              {expandedHistoryId === instructor.id && (
                <div className="space-y-1.5 rounded-lg border border-border bg-secondary/30 p-2">
                  {penalties.filter((p) => p.instructorId === instructor.id).length === 0 ? (
                    <p className="py-2 text-center text-[11px] text-muted-foreground">이력이 없습니다.</p>
                  ) : (
                    penalties
                      .filter((p) => p.instructorId === instructor.id)
                      .map((p) => (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between gap-2 rounded-md border p-2 text-[11px] ${
                            p.voided ? "border-border/50 bg-transparent opacity-50" : "border-border bg-card"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className={`text-foreground ${p.voided ? "line-through" : ""}`}>
                              {p.violationType} · {p.description}
                            </p>
                            <p className="text-muted-foreground">
                              {new Date(p.createdAt).toLocaleString("ko-KR")}
                              {p.voided && " · 정정됨"}
                            </p>
                          </div>
                          {!p.voided && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 shrink-0 text-[10px] text-destructive hover:text-destructive"
                              disabled={voidingPenaltyId === p.id}
                              onClick={() => handleVoidPenalty(p.id, instructor.id)}
                            >
                              정정(취소)
                            </Button>
                          )}
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminInstructorsPage;
