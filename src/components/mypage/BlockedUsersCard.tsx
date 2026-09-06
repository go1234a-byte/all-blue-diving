import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { formatDateKR } from "@/lib/dates";

/** 마이페이지 - 차단한 사용자 목록 및 해제 (App Store Guideline 1.2). */
export function BlockedUsersCard() {
  const { blockedUsers, unblock } = useBlockedUsers();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">차단 관리</h3>
      <div className="rounded-xl border border-border bg-card p-4">
        {blockedUsers.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">차단한 사용자가 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {blockedUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-2">
                <Ban className="h-3.5 w-3.5 shrink-0 text-destructive" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{u.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDateKR(u.blockedAt)} 차단 · 이 사용자의 채팅·후기가 숨겨집니다
                  </p>
                </div>
                <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" onClick={() => unblock(u.id)}>
                  차단 해제
                </Button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 break-keep text-[11px] text-muted-foreground">
          부적절한 콘텐츠나 악의적 사용자는 채팅·후기의 신고 또는 차단 기능을 이용해주세요. 운영팀은 접수 후 24시간 이내에
          콘텐츠를 삭제하고 해당 이용자를 조치합니다.
        </p>
      </div>
    </div>
  );
}
