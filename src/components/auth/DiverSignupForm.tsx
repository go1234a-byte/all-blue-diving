import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/contexts/AppDataContext";
import type { Gender } from "@/types";

interface DiverSignupFormProps {
  onSuccess: () => void;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function DiverSignupForm({ onSuccess }: DiverSignupFormProps) {
  const { toast } = useToast();
  const { registerDiverProfile } = useAppData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [birthDate, setBirthDate] = useState("");
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
    if (password.length < 8) {
      toast({
        title: "비밀번호는 8자 이상이어야 합니다",
        description: "영문, 숫자 등을 조합해 8자 이상으로 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "비밀번호가 일치하지 않습니다", description: "비밀번호와 비밀번호 확인을 다시 확인해주세요.", variant: "destructive" });
      return;
    }
    if (!agreedTerms) {
      toast({ title: "이용약관 및 개인정보처리방침에 동의해주세요", variant: "destructive" });
      return;
    }
    if (!emergencyContactName || !emergencyContactPhone) {
      toast({ title: "비상연락처를 입력해주세요", description: "다이빙 투어 중 안전을 위해 필요합니다.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // 탈퇴 후 6개월 재가입 제한 확인
      // 주의: deleted_accounts 테이블은 탈퇴회원 이메일/전화번호가 담긴 민감정보라 RLS로
      // 완전히 잠갔다(RLS 보안 강화 1단계 batch96 참고). 로그인 전에도 확인해야 하므로,
      // 원본 행을 노출하지 않고 "최근 6개월 내 탈퇴 여부"만 boolean으로 돌려주는
      // is_recently_deleted_account() RPC로 대체한다.
      const { data: isRecentlyDeleted } = await supabase.rpc("is_recently_deleted_account", {
        p_email: email,
      });

      if (isRecentlyDeleted) {
        toast({
          title: "재가입이 제한된 계정입니다",
          description: "회원 보호 정책에 따라 탈퇴 후 6개월 동안은 동일한 정보로 재가입이 불가능합니다.",
          variant: "destructive",
        });
        return;
      }

      let { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });

      // "이미 등록된 사용자" 오류가 아니라면 순간적인 네트워크 문제 등 일시적 오류일 수
      // 있으므로, 짧게 대기 후 한 번 자동으로 재시도한다 — 예전에는 여기서 실패하면 바로
      // 에러 토스트만 띄우고 끝나서, 사용자가 직접 '가입하기'를 다시 눌러야만 복구됐다.
      if (error && !/already registered|already exists/i.test(error.message ?? "")) {
        console.warn("[DiverSignupForm] 계정 생성 1차 실패, 1.2초 후 자동 재시도:", error);
        await sleep(1200);
        const retry = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        data = retry.data;
        error = retry.error;
      }

      let userId = data?.user?.id;

      if (error || !userId) {
        // Supabase는 "로그인 계정(auth)은 만들어졌는데 프로필 저장 단계에서 실패해
        // 프로필 없이 붕 뜬 계정"이 된 경우에도, 같은 이메일로 재가입을 시도하면
        // 세션 없이 "이미 등록된 사용자" 에러만 던진다 — 이 경우 그대로 실패 처리하면
        // 그 계정으로는 영영 가입을 못 끝내게 되므로, 방금 입력한 비밀번호로 로그인을
        // 시도해 본인 계정이 맞는지 확인하고, 맞으면 프로필 생성을 이어서 진행한다.
        const isAlreadyRegistered = /already registered|already exists/i.test(error?.message ?? "");
        if (!isAlreadyRegistered) {
          toast({ title: "회원가입에 실패했습니다", description: error?.message, variant: "destructive" });
          return;
        }

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError || !signInData.user) {
          toast({
            title: "이미 가입된 이메일입니다",
            description: "이전에 가입을 시도하셨다가 완료되지 않은 계정일 수 있어요. 방금 입력한 비밀번호로 로그인해보시거나, 다른 이메일로 가입해주세요.",
            variant: "destructive",
          });
          return;
        }

        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", signInData.user.id)
          .maybeSingle();
        if (existingProfile) {
          toast({ title: "이미 가입이 완료된 계정입니다", description: "로그인해서 이용해주세요.", variant: "destructive" });
          return;
        }

        // auth 계정은 있지만 프로필이 없는, 직전 시도가 중간에 끊긴 상태 — 프로필 생성만 이어서 진행.
        userId = signInData.user.id;
      }

      const profileInsertPayload = {
        id: userId,
        role: "diver",
        name,
        phone,
        gender,
        birth_date: birthDate || null,
        c_card_agency: cCardAgency || null,
        c_card_number: cCardNumber || null,
        log_count: logCount ? Number(logCount) : null,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        insurance_info: insuranceInfo || null,
      };

      let { error: profileError } = await supabase.from("profiles").insert(profileInsertPayload);

      // 네트워크 순간 끊김 등 일시적 오류일 수 있으므로(birth_date 스키마 캐시 문제는 바로
      // 아래에서 별도로 다루므로 여기서는 재시도하지 않는다), 짧게 대기 후 한 번 더 자동
      // 재시도한다. 이전에는 여기서 실패하면 로그인 계정만 만들어진 채로 끝나버려서, 사용자가
      // "오류가 떴는데 다시 등록을 누르니 그냥 통과됐다"고 느끼는 원인이었다 — auth 계정은
      // 이미 있고 프로필만 없는 상태라 재클릭 시 복구 경로를 타서 결과적으로는 성공했던 것.
      if (
        profileError &&
        !(/birth_date/i.test(profileError.message) && /schema cache/i.test(profileError.message))
      ) {
        console.warn("[DiverSignupForm] 프로필 저장 1차 실패, 1.2초 후 자동 재시도:", profileError);
        await sleep(1200);
        const retry = await supabase.from("profiles").insert(profileInsertPayload);
        profileError = retry.error;
      }

      // 서버 스키마 캐시가 birth_date 컬럼을 아직 인식하지 못해 "Could not find the
      // 'birth_date' column ... in the schema cache" 에러가 나는 경우(마이그레이션이 실제
      // 반영 전이거나 캐시 갱신 전), 생년월일 하나 때문에 가입 자체가 막히면 안 되므로
      // 그 필드만 빼고 한 번 더 시도한다. 나중에 스키마가 정상화되면 마이페이지에서 다시
      // 입력하면 된다.
      let birthDateDropped = false;
      if (profileError && /birth_date/i.test(profileError.message) && /schema cache/i.test(profileError.message)) {
        console.error("[DiverSignupForm] birth_date 컬럼 스키마 캐시 문제, birth_date 없이 재시도:", profileError);
        const { birth_date: _omit, ...withoutBirthDate } = profileInsertPayload;
        const retry = await supabase.from("profiles").insert(withoutBirthDate);
        profileError = retry.error;
        birthDateDropped = !profileError;
      }

      if (profileError) {
        toast({ title: "프로필 생성에 실패했습니다", description: profileError.message, variant: "destructive" });
        return;
      }

      if (birthDateDropped) {
        toast({
          title: "생년월일은 이번에 저장되지 않았어요",
          description: "서버 설정 문제로 생년월일만 빠졌어요. 나머지 가입은 정상 완료됐으니, 나중에 마이페이지에서 다시 입력해주세요.",
        });
      }

      // Supabase에는 저장됐지만 앱 메모리(diverProfiles)에는 반영이 안 돼 있으므로,
      // 새로고침 없이도 마이페이지 등에서 방금 입력한 정보가 바로 보이도록 즉시 로컬 상태에 반영한다.
      registerDiverProfile({
        id: userId,
        role: "diver",
        name,
        phone,
        gender,
        birthDate: birthDate || undefined,
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
        <Label htmlFor="diver-password-confirm">비밀번호 확인</Label>
        <Input
          id="diver-password-confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="비밀번호를 한 번 더 입력해주세요"
          aria-invalid={confirmPassword.length > 0 && confirmPassword !== password}
        />
        {confirmPassword.length > 0 && confirmPassword !== password && (
          <p className="text-xs text-destructive">비밀번호가 일치하지 않습니다.</p>
        )}
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
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>성별</Label>
          <RadioGroup value={gender} onValueChange={(v) => setGender(v as Gender)} className="flex h-10 items-center gap-4">
            <label className="flex items-center gap-1.5 text-sm">
              <RadioGroupItem value="male" /> 남성
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <RadioGroupItem value="female" /> 여성
            </label>
          </RadioGroup>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="diver-birth-date">생년월일</Label>
          <Input id="diver-birth-date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </div>
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

      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <Checkbox
          checked={agreedTerms}
          onCheckedChange={(v) => setAgreedTerms(v === true)}
          className="mt-0.5"
        />
        <span>ALL BLUE 이용약관 및 개인정보처리방침에 동의합니다. (필수)</span>
      </label>

      <Button type="submit" className="w-full" disabled={submitting || !agreedTerms}>
        {submitting ? "가입 처리 중..." : "일반 다이버로 가입하기"}
      </Button>
    </form>
  );
}
