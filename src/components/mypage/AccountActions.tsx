import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/** 마이페이지 공용 계정 관리 액션 — 로그아웃 / 회원 탈퇴(6개월 재가입 제한 안내). */
export function AccountActions() {
  const navigate = useNavigate();
  const { logout } = useRole();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        toast({ title: "로그인 세션이 없습니다", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error || !data?.success) {
        toast({
          title: "회원 탈퇴에 실패했습니다",
          description: error?.message ?? "잠시 후 다시 시도해주세요.",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "탈퇴가 완료되었습니다", description: "그동안 ALL BLUE를 이용해주셔서 감사합니다." });
      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button variant="outline" className="flex-1 gap-2" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        로그아웃
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" className="flex-1 gap-2 text-destructive hover:text-destructive">
            <UserX className="h-4 w-4" />
            회원 탈퇴
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 탈퇴하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription className="break-keep leading-relaxed">
              탈퇴 시 모든 데이터는 복구 불가능하며, 회원 보호 정책에 따라 탈퇴 후 6개월 동안은 동일한
              정보로 재가입이 불가능합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={handleDeleteAccount}
            >
              {deleting ? "처리 중..." : "탈퇴하기"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
