import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * 비밀번호 재설정 이메일의 링크를 클릭하면 도착하는 화면.
 * Supabase가 링크의 인증 토큰으로 임시 세션을 자동으로 만들어주므로,
 * 여기서는 그 세션 상태에서 새 비밀번호로 updateUser만 호출하면 된다.
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "비밀번호는 8자 이상 입력해주세요", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "비밀번호가 일치하지 않습니다", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({
          title: "비밀번호 변경에 실패했습니다",
          description: "재설정 링크가 만료되었을 수 있어요. 다시 시도해주세요.",
          variant: "destructive",
        });
        return;
      }
      setDone(true);
      toast({ title: "비밀번호가 변경되었습니다!" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-surface">
      <div className="mx-auto flex w-full max-w-md flex-col px-4 py-8 md:max-w-lg">
        <Link to="/" className="mx-auto mb-6">
          <Logo size="md" showTagline />
        </Link>

        <div className="mt-2 space-y-5 rounded-2xl border border-border bg-card p-5 shadow-ocean">
          <h1 className="text-center text-lg font-bold text-foreground">새 비밀번호 설정</h1>

          {done ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">비밀번호가 변경되었습니다. 이제 새 비밀번호로 로그인해주세요.</p>
              <Button className="w-full" onClick={() => navigate("/auth", { replace: true })}>
                로그인하러 가기
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">새 비밀번호</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8자 이상 입력해주세요"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력해주세요"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "변경 중..." : "비밀번호 변경"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
