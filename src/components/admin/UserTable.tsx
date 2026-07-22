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
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import type { ProfileStatus } from "@/types";

const STATUS_LABEL: Record<ProfileStatus, string> = {
  active: "정상",
  warned: "경고",
  suspended: "활동정지",
};

const STATUS_VARIANT: Record<ProfileStatus, "default" | "secondary" | "destructive"> = {
  active: "default",
  warned: "secondary",
  suspended: "destructive",
};

/** 모바일 폭에 맞춘 카드형 회원 목록 — 기존 데스크톱 표 대신 사용한다. */
export function UserTable() {
  const { diverProfiles, instructorProfiles, setProfileStatus } = useAppData();
  const { toast } = useToast();
  const allUsers = [...instructorProfiles, ...diverProfiles];

  const handleStatusChange = (userId: string, userName: string, status: ProfileStatus) => {
    setProfileStatus(userId, status);
    toast({ title: `${userName}님을 ${STATUS_LABEL[status]} 처리했습니다.` });
  };

  return (
    <div className="space-y-2">
      {allUsers.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">등록된 회원이 없습니다.</p>
      )}
      {allUsers.map((user) => (
        <div key={user.id} className="space-y-2 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="line-clamp-1 text-sm font-semibold text-foreground">{user.name}</p>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {user.role === "instructor" ? "강사" : "다이버"}
              </Badge>
            </div>
            <Badge variant={STATUS_VARIANT[user.status]} className="shrink-0 text-[10px]">
              {STATUS_LABEL[user.status]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{user.phone}</p>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="flex-1 text-xs" disabled={user.status === "warned"}>
                  회원 경고
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{user.name}님에게 경고를 주시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    경고 처리 시 회원 상태가 &apos;경고&apos;로 변경됩니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleStatusChange(user.id, user.name, "warned")}>
                    경고 처리
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 text-xs"
                  disabled={user.status === "suspended"}
                >
                  활동 정지
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{user.name}님을 활동정지 시키겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    활동정지 처리 시 해당 회원은 서비스 이용이 제한됩니다. 이 작업은 나중에 다시 해제할 수 있습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleStatusChange(user.id, user.name, "suspended")}>
                    활동정지
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {user.status !== "active" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="secondary" className="w-full text-xs">
                  {user.status === "warned" ? "경고 해제" : "활동정지 해제"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{user.name}님을 정상 상태로 되돌리시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {user.status === "warned" ? "경고" : "활동정지"} 처리가 해제되고 &apos;정상&apos; 상태로 변경됩니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleStatusChange(user.id, user.name, "active")}>
                    정상으로 복귀
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      ))}
    </div>
  );
}
