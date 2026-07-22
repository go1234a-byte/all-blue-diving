import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
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
  const allUsers = [...instructorProfiles, ...diverProfiles];

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
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => setProfileStatus(user.id, "warned")}
              disabled={user.status === "warned"}
            >
              회원 경고
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 text-xs"
              onClick={() => setProfileStatus(user.id, "suspended")}
              disabled={user.status === "suspended"}
            >
              활동 정지
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
