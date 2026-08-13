import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import type { Gender } from "@/types";

/**
 * 카카오 등 SNS 로그인은 이메일/비밀번호 가입 폼과 달리 이름/연락처/비상연락처 같은
 * 필수 정보를 미리 받을 방법이 없다 — Supabase Auth 계정(auth.users)만 즉시 만들어지고
 * profiles row가 아예 없는 상태로 앱에 들어오게 된다. RootLayout이 "로그인은 됐는데
 * profiles가 없는" 사용자를 이 화면으로 보내 최소 필수 정보만 받고 다이버로 등록한다.
 * (사진/자격증 등 선택 정보는 가입 후 마이페이지에서 언제든 추가로 입력할 수 있다.)
 */
export default function CompleteProfile() {
  const { user } = useRole();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      toast({ title: "이름을 입력해주세요", variant: "destructive" });
      return;
    }
    if (!phone.trim()) {
      toast({ title: "연락처를 입력해주세요", variant: "destructive" });
      return;
    }
    if (!emergencyContactName.trim() || !emergencyContactPhone.trim()) {
      toast({ title: "비상연락처를 입력해주세요", description: "다이빙 투어 중 안전을 위해 필요합니다.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        role: "diver",
        name,
        phone,
        gender,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
      });
      if (error) {
        toast({ title: "정보 저장에 실패했습니다", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "가입이 완료되었습니다!", description: "ALL BLUE에 오신 걸 환영해요." });
      window.location.href = "/";
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-surface">
      <div className="mx-auto flex w-full max-w-md flex-col px-4 py-8 md:max-w-lg">
        <div className="mx-auto mb-6">
          <Logo size="md" showTagline />
        </div>

        <div className="space-y-1 text-center">
          <h1 className="text-xl font-bold text-foreground">추가 정보 입력</h1>
          <p className="text-sm text-muted-foreground">
            간편 로그인 계정으로 처음 방문하셨어요. 예약에 필요한 최소 정보만 입력해주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-5 shadow-ocean">
          <div className="space-y-1.5">
            <Label htmlFor="cp-name">이름</Label>
            <Input id="cp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-phone">휴대폰 번호</Label>
            <Input
              id="cp-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>
          <div className="space-y-1.5">
            <Label>성별</Label>
            <RadioGroup value={gender} onValueChange={(v) => setGender(v as Gender)} className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm">
                <RadioGroupItem value="male" /> 남성
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <RadioGroupItem value="female" /> 여성
              </label>
            </RadioGroup>
          </div>
          <div className="space-y-3 rounded-xl border border-border p-3">
            <Label className="text-sm font-semibold">비상연락처 (필수)</Label>
            <div className="space-y-1.5">
              <Label htmlFor="cp-ec-name">이름</Label>
              <Input
                id="cp-ec-name"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="비상시 연락할 분의 이름"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-ec-phone">연락처</Label>
              <Input
                id="cp-ec-phone"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="010-0000-0000"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "저장 중..." : "시작하기"}
          </Button>
        </form>
      </div>
    </div>
  );
}
