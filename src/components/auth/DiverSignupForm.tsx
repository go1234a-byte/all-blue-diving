import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/contexts/AppDataContext";
import type { Gender } from "@/types";

interface DiverSignupFormProps {
  onSuccess: () => void;
}

export function DiverSignupForm({ onSuccess }: DiverSignupFormProps) {
  const { toast } = useToast();
  const { registerDiverProfile } = useAppData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [cCardAgency, setCCardAgency] = useState("");
  const [cCardNumber, setCCardNumber] = useState("");
  const [logCount, setLogCount] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [insuranceInfo, setInsuranceInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !phone) {
      toast({ title: "필수 항목을 입력해주세요", variant: "destructive" });
      return;
    }
    if (!emergencyContactName || !emergencyContactPhone) {
      toast({ title: "비상연락처를 입력해주세요", description: "다이빙 투어 중 안전을 위해 필요합니다.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // 탈퇴 후 6개월 재가입 제한 확인
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const { data: deletedRecord } = await supabase
        .from("deleted_accounts")
        .select("id, deleted_at")
        .eq("email", email)
        .gte("deleted_at", sixMonthsAgo.toISOString())
        .maybeSingle();

      if (deletedRecord) {
        toast({
          title: "재가입이 제한된 계정입니다",
          description: "회원 보호 정책에 따라 탈퇴 후 6개월 동안은 동일한 정보로 재가입이 불가능합니다.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });

      if (error || !data.user) {
        toast({ title: "회원가입에 실패했습니다", description: error?.message, variant: "destructive" });
        return;
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        role: "diver",
        name,
        phone,
        gender,
        c_card_agency: cCardAgency || null,
        c_card_number: cCardNumber || null,
        log_count: logCount ? Number(logCount) : null,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        insurance_info: insuranceInfo || null,
      });

      if (profileError) {
        toast({ title: "프로필 생성에 실패했습니다", description: profileError.message, variant: "destructive" });
        return;
      }

      // Supabase에는 저장됐지만 앱 메모리(diverProfiles)에는 반영이 안 돼 있으므로,
      // 새로고침 없이도 마이페이지 등에서 방금 입력한 정보가 바로 보이도록 즉시 로컬 상태에 반영한다.
      registerDiverProfile({
        id: data.user.id,
        role: "diver",
        name,
        phone,
        gender,
        status: "active",
        createdAt: new Date().toISOString(),
        cCardAgency: cCardAgency || undefined,
        cCardNumber: cCardNumber || undefined,
        logCount: logCount ? Number(logCount) : undefined,
        emergencyContactName,
        emergencyContactPhone,
        insuranceInfo: insuranceInfo || undefined,
      });

      toast({ title: "일반 다이버 회원가입이 완료되었습니다!", description: "환영합니다! 홈 화면으로 이동합니다." });
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="diver-email">이메일</Label>
        <Input
          id="diver-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="diver@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="diver-password">비밀번호</Label>
        <Input
          id="diver-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8자 이상 입력해주세요"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="diver-name">이름</Label>
        <Input id="diver-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="diver-phone">휴대폰 번호</Label>
        <Input
          id="diver-phone"
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

      <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-3">
        <p className="text-xs font-semibold text-foreground">다이빙 자격 정보 (선택)</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="diver-ccard-agency">C-Card 발급기관</Label>
            <Input
              id="diver-ccard-agency"
              value={cCardAgency}
              onChange={(e) => setCCardAgency(e.target.value)}
              placeholder="예: PADI, SSI"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="diver-ccard-number">자격증 번호</Label>
            <Input
              id="diver-ccard-number"
              value={cCardNumber}
              onChange={(e) => setCCardNumber(e.target.value)}
              placeholder="자격증 번호"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="diver-log-count">보유 로그 수</Label>
          <Input
            id="diver-log-count"
            type="number"
            min={0}
            value={logCount}
            onChange={(e) => setLogCount(e.target.value)}
            placeholder="예: 50"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-3">
        <p className="text-xs font-semibold text-foreground">비상연락처 <span className="text-destructive">*</span></p>
        <p className="text-[11px] text-muted-foreground">다이빙 투어 중 응급상황 발생 시 연락드립니다.</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="diver-emergency-name">이름</Label>
            <Input
              id="diver-emergency-name"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              placeholder="비상연락처 이름"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="diver-emergency-phone">연락처</Label>
            <Input
              id="diver-emergency-phone"
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="diver-insurance">여행자/다이빙 보험 정보 (선택)</Label>
        <Textarea
          id="diver-insurance"
          value={insuranceInfo}
          onChange={(e) => setInsuranceInfo(e.target.value)}
          placeholder="예: OO보험 여행자보험, 증권번호 12345"
          className="min-h-16 text-sm"
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "가입 처리 중..." : "일반 다이버로 가입하기"}
      </Button>
    </form>
  );
}
