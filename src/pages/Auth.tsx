import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DiverSignupForm } from "@/components/auth/DiverSignupForm";
import { InstructorSignupForm } from "@/components/auth/InstructorSignupForm";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "이메일과 비밀번호를 입력해주세요", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "로그인에 실패했습니다", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "로그인되었습니다!" });
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="login-email">이메일</Label>
        <Input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password">비밀번호</Label>
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력해주세요"
        />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "로그인 중..." : "로그인"}
      </Button>
    </form>
  );
}

interface AuthLocationState {
  returnTo?: string;
  returnState?: unknown;
  reason?: "booking";
}

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { returnTo, returnState, reason } = (location.state as AuthLocationState | null) ?? {};

  // "예약하기"를 눌러서 넘어온 경우 가입/로그인 완료 후 원래 보던 결제 화면으로 돌아간다.
  // 그 외에는 기존대로 홈(디스커버리 피드)으로 이동한다.
  const handleSuccess = () =>
    navigate(returnTo ?? "/", { replace: true, state: returnTo ? returnState : undefined });

  return (
    <div className="min-h-full bg-gradient-surface">
      <div className="mx-auto flex w-full max-w-md flex-col px-4 py-8 md:max-w-lg">
        <Link to="/" className="mx-auto mb-6">
          <Logo size="md" showTagline />
        </Link>

        <div className="space-y-1 text-center">
          <h1 className="text-xl font-bold text-foreground">로그인 / 회원가입</h1>
          <p className="text-sm text-muted-foreground">
            {reason === "booking"
              ? "예약을 완료하려면 로그인 또는 회원가입이 필요해요. 가입 후 바로 예약을 이어갈 수 있어요."
              : "전 세계 다이빙 투어를 지금 바로 예약해보세요."}
          </p>
        </div>

        <div className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-5 shadow-ocean">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="diver">다이버 가입</TabsTrigger>
              <TabsTrigger value="instructor">강사 가입</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="pt-3">
              <LoginForm onSuccess={handleSuccess} />
            </TabsContent>
            <TabsContent value="diver" className="pt-3">
              <DiverSignupForm onSuccess={handleSuccess} />
            </TabsContent>
            <TabsContent value="instructor" className="pt-3">
              <InstructorSignupForm onSuccess={handleSuccess} />
            </TabsContent>
          </Tabs>

          <SocialAuthButtons />
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          가입을 진행하면 ALL BLUE 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
};

export default Auth;
