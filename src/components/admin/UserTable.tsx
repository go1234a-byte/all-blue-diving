import { useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const { diverProfiles, instructorProfiles, instructors, setProfileStatus } = useAppData();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "diver" | "instructor">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ProfileStatus>("all");
  const allUsersRaw = [...instructorProfiles, ...diverProfiles];
  const normalizedQuery = query.trim().toLowerCase();
  const allUsers = allUsersRaw.filter((user) => {
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    if (statusFilter !== "all" && user.status !== statusFilter) return false;
    if (!normalizedQuery) return true;
    return (
      user.name.toLowerCase().includes(normalizedQuery) ||
      (user.phone ?? "").toLowerCase().includes(normalizedQuery)
    );
  });

  const handleStatusChange = (userId: string, userName: string, status: ProfileStatus) => {
    setProfileStatus(userId, status);
    toast({ title: `${userName}님을 ${STATUS_LABEL[status]} 처리했습니다.` });
  };

  /** 강사는 profile.id와 instructors.id가 별개 PK라서, 프로필 상세로 가려면 instructors 테이블에서 매칭되는 id를 찾아야 한다. */
  const detailLinkFor = (user: (typeof allUsers)[number]) => {
    if (user.role === "instructor") {
      const instructor = instructors.find((i) => i.profileId === user.id);
      return instructor ? `/instructor/${instructor.id}/profile` : undefined;
    }
    return `/admin/users/${user.id}`;
  };

  return (
    <div className="space-y-2">
      <div className="space-y-2 rounded-xl border border-border bg-card p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름 또는 전화번호로 검색"
            className="h-8 pl-8 text-xs"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 역할</SelectItem>
              <SelectItem value="diver">다이버</SelectItem>
              <SelectItem value="instructor">강사</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="active">정상</SelectItem>
              <SelectItem value="warned">경고</SelectItem>
              <SelectItem value="suspended">활동정지</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {allUsers.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">조건에 맞는 회원이 없습니다.</p>
      )}
      {allUsers.map((user) => {
        const detailLink = detailLinkFor(user);
        return (
        <div key={user.id} className="space-y-2 rounded-xl border border-border bg-card p-3">
          {detailLink ? (
            <Link to={detailLink} className="block space-y-2 transition-colors hover:opacity-80">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <p className="line-clamp-1 text-sm font-semibold text-foreground">{user.name}</p>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {user.role === "instructor" ? "강사" : "다이버"}
                  </Badge>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Badge variant={STATUS_VARIANT[user.status]} className="text-[10px]">
                    {STATUS_LABEL[user.status]}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{user.phone}</p>
            </Link>
          ) : (
            <div className="space-y-2">
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
            </div>
          )}
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
        );
      })}
    </div>
  );
}
