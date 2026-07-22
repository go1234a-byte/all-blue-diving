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
import { VerifiedBadge } from "@/components/tour/VerifiedBadge";
import { InstructorApplicationQueue } from "@/components/mypage/InstructorApplicationQueue";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";

/** 2회 경고 누적 시 자동으로 영구정지 처리한다 (setInstructorPenalty 내부 로직과 동일 기준). */
const PERMANENT_BAN_THRESHOLD = 2;

const AdminInstructorsPage = () => {
  const { instructors, tours, instructorProfiles, setInstructorPenalty, setProfileStatus } = useAppData();
  const { toast } = useToast();

  const handleWarn = (instructorId: string, instructorName: string, currentPenalty: number) => {
    const next = currentPenalty + 1;
    setInstructorPenalty(instructorId, next);
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
    toast({ title: `${instructorName} 강사를 영구정지 처리했습니다.`, variant: "destructive" });
  };

  const handleReinstate = (instructorId: string, instructorName: string, profileId: string) => {
    setInstructorPenalty(instructorId, 0);
    setProfileStatus(profileId, "active");
    toast({ title: `${instructorName} 강사의 영구정지를 해제했습니다.` });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {instructors.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">등록된 강사가 없습니다.</p>
        )}
        {instructors.map((instructor) => {
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
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
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
