import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DiverSignupForm } from "@/components/auth/DiverSignupForm";
import { InstructorSignupForm } from "@/components/auth/InstructorSignupForm";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/** "아이디(이메일) 찾기" 다이얼로그 — 이름+휴대폰 번호로 가입된 이메일을 마스킹해서 찾아준다. */
function FindEmailDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{ role: string; maskedEmail: string }[] | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!name.trim() || !phone.trim()) {
      toast({ title: "이름과 휴대폰 번호를 입력해주세요", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    setSearched(false);
    try {
      const { data, error } = await supabase.functions.invoke("find-account", {
        body: { name: name.trim(), phone: phone.trim() },
      });
      if (error) {
        toast({ title: "조회에 실패했습니다", description: error.message, variant: "destructive" });
        return;
      }
      setResults(data?.results ?? []);
      setSearched(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setName("");
          setPhone("");
          setResults(null);
          setSearched(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <button type="button" className="text-xs text-muted-foreground underline underline-offset-2">
          아이디(이메일) 찾기
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>아이디(이메일) 찾기</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <p className="text-xs text-muted-foreground">가입 시 입력한 이름과 휴대폰 번호로 이메일을 찾아드려요.</p>
          <div className="space-y-1.5">
            <Label>이름</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
          </div>
          <div className="space-y-1.5">
            <Label>휴대폰 번호</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
          </div>
          <Button type="button" className="w-full" onClick={handleSearch} disabled={submitting}>
            {submitting ? "조회 중..." : "이메일 찾기"}
          </Button>
          {searched && (
            <div className="space-y-1.5 rounded-lg border border-border bg-secondary/40 p-3 text-sm">
              {results && results.length > 0 ? (
                results.map((r, i) => (
                  <p key={i} className="font-medium text-foreground">
                    {r.role === "instructor" ? "강사" : "다이버"} 계정: {r.maskedEmail}
                  </p>
                ))
              ) : (
                <p className="text-muted-foreground">일치하는 계정을 찾을 수 없습니다.</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** "비밀번호 찾기" 다이얼로그 — Supabase Auth의 재설정 이메일 발송 기능을 사용한다. */
function ResetPasswordDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      toast({ title: "이메일을 입력해주세요", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: "이메일 발송에 실패했습니다", description: error.message, variant: "destructive" });
        return;
      }
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setEmail("");
          setSent(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <button type="button" className="text-xs text-muted-foreground underline underline-offset-2">
          비밀번호 찾기
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>비밀번호 찾기</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {sent ? (
            <p className="text-sm text-foreground">
              <strong>{email}</strong> 주소로 비밀번호 재설정 링크를 보내드렸어요. 메일함(스팸함 포함)을 확인해주세요.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">가입한 이메일로 비밀번호 재설정 링크를 보내드려요.</p>
              <div className="space-y-1.5">
                <Label>이메일</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <Button type="button" className="w-full" onClick={handleSend} disabled={submitting}>
                {submitting ? "발송 중..." : "재설정 링크 받기"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
      <div className="flex items-center justify-center gap-3">
        <FindEmailDialog />
        <span className="text-muted-foreground">·</span>
        <ResetPasswordDialog />
      </div>
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
