import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FileDropzone } from "@/components/auth/FileDropzone";
import { SignaturePad } from "@/components/auth/SignaturePad";
import { OnboardingProgress } from "@/components/auth/OnboardingProgress";
import { PledgeAgreement } from "@/components/auth/PledgeAgreement";
import { useAppData } from "@/contexts/AppDataContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Gender } from "@/types";

interface InstructorSignupFormProps {
  onSuccess: () => void;
}

const STEP_LABELS = [
  "신분증 · 정산계좌 인증",
  "강사 자격증 업로드",
  "보험 등록 (선택)",
  "플랫폼 윤리강령",
  "전자 서약",
  "관리자 승인",
];

const TOTAL_STEPS = STEP_LABELS.length;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ETHICS_CODE = [
  "모든 참가자를 성별, 국적, 신체 조건에 관계없이 동등하게 존중합니다.",
  "다이빙 안전 수칙과 장비 점검을 철저히 준수합니다.",
  "투어 정보와 자격 사항을 사실대로 정확히 게재합니다.",
  "플랫폼을 통해 발생한 문제는 성실히 협조하여 해결합니다.",
];

export function InstructorSignupForm({ onSuccess }: InstructorSignupFormProps) {
  const { addInstructorSignup } = useAppData();
  const { toast } = useToast();

  const [step, setStep] = useState(1);

  // 계정 기본 정보 (기존 필드 유지)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [bio, setBio] = useState("");

  // 1) 신분증 인증
  const [idFiles, setIdFiles] = useState<File[]>([]);
  // 1) 정산 계좌 (통장사본)
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankbookFiles, setBankbookFiles] = useState<File[]>([]);
  // 2) 강사 자격증
  const [licenseFiles, setLicenseFiles] = useState<File[]>([]);
  // 3) 보험 등록 (선택)
  const [insuranceFiles, setInsuranceFiles] = useState<File[]>([]);
  // 4) 플랫폼 윤리강령
  const [ethicsAgreed, setEthicsAgreed] = useState(false);
  // 5) 전자 서약
  const [pledgeSignerName, setPledgeSignerName] = useState("");
  const [pledgeAgreed, setPledgeAgreed] = useState(false);
  const [signature, setSignature] = useState<string | undefined>(undefined);

  const [submitting, setSubmitting] = useState(false);

  const canGoNext = (): boolean => {
    switch (step) {
      case 1:
        if (!name || !phone || !email || !password || idFiles.length === 0) {
          toast({
            title: "필수 항목을 입력해주세요",
            description: "이메일/비밀번호/이름/연락처/신분증 사본은 필수입니다.",
            variant: "destructive",
          });
          return false;
        }
        if (!bankName || !accountHolder || !accountNumber || bankbookFiles.length === 0) {
          toast({
            title: "정산 계좌 정보를 입력해주세요",
            description: "은행명/예금주명/계좌번호와 통장사본은 필수입니다.",
            variant: "destructive",
          });
          return false;
        }
        if (password.length < 8) {
          toast({
            title: "비밀번호는 8자 이상이어야 합니다",
            description: "영문, 숫자 등을 조합해 8자 이상으로 입력해주세요.",
            variant: "destructive",
          });
          return false;
        }
        if (password !== confirmPassword) {
          toast({ title: "비밀번호가 일치하지 않습니다", description: "비밀번호와 비밀번호 확인을 다시 확인해주세요.", variant: "destructive" });
          return false;
        }
        if (!agreedTerms) {
          toast({ title: "이용약관 및 개인정보처리방침에 동의해주세요", variant: "destructive" });
          return false;
        }
        return true;
      case 2:
        if (licenseFiles.length === 0) {
          toast({ title: "강사 자격증 서류를 업로드해주세요", variant: "destructive" });
          return false;
        }
        return true;
      case 3:
        return true;
      case 4:
        if (!ethicsAgreed) {
          toast({ title: "플랫폼 윤리강령에 동의해주세요", variant: "destructive" });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!canGoNext()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword || !agreedTerms) {
      toast({ title: "계정 정보를 다시 확인해주세요", description: "비밀번호 확인 또는 약관 동의가 완료되지 않았습니다.", variant: "destructive" });
      setStep(1);
      return;
    }
    if (!pledgeSignerName.trim() || !pledgeAgreed || !signature) {
      toast({
        title: "전자 서약을 완료해주세요",
        description: "이름 입력, 동의 체크박스, 서명을 모두 완료해야 합니다.",
        variant: "destructive",
      });
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

      let { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });

      // "이미 등록된 사용자" 오류가 아니라면 순간적인 네트워크 문제 등 일시적 오류일 수
      // 있으므로, 짧게 대기 후 한 번 자동으로 재시도한다 — 예전에는 여기서 실패하면 바로
      // 에러 토스트만 띄우고 끝나서, 사용자가 직접 '가입 신청하기'를 다시 눌러야만 복구됐다.
      if (signUpError && !/already registered|already exists/i.test(signUpError.message ?? "")) {
        console.warn("[InstructorSignupForm] 계정 생성 1차 실패, 1.2초 후 자동 재시도:", signUpError);
        await sleep(1200);
        const retry = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        signUpData = retry.data;
        signUpError = retry.error;
      }

      let userId = signUpData?.user?.id;

      if (signUpError || !userId) {
        // 다이버 가입폼과 동일한 이유: auth 계정은 생성됐는데 프로필 저장 단계에서
        // 실패해 프로필 없이 붕 뜬 계정이 된 경우, 같은 이메일 재가입 시도는 세션 없는
        // "이미 등록된 사용자" 에러만 던진다. 방금 입력한 비밀번호로 로그인해서 본인
        // 계정이 맞는지 확인 후, 맞으면 프로필 생성을 이어서 진행한다.
        const isAlreadyRegistered = /already registered|already exists/i.test(signUpError?.message ?? "");
        if (!isAlreadyRegistered) {
          toast({ title: "회원가입에 실패했습니다", description: signUpError?.message, variant: "destructive" });
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

        userId = signInData.user.id;
      }

      const instructorProfilePayload = {
        id: userId,
        role: "instructor",
        name,
        phone,
        gender,
        pledge_settlement_agreed: true,
        pledge_settlement_agreed_at: new Date().toISOString(),
        bank_name: bankName,
        account_holder: accountHolder,
        account_number: accountNumber,
        bankbook_file_name: bankbookFiles[0]?.name ?? null,
      };

      let { error: profileError } = await supabase.from("profiles").insert(instructorProfilePayload);

      // 네트워크 순간 끊김 등 일시적 오류일 수 있으므로 짧게 대기 후 한 번 더 자동 재시도한다.
      // 이전에는 여기서 실패하면 로그인 계정만 만들어진 채로 끝나버려서, 사용자가 "오류가
      // 떴는데 다시 등록을 누르니 그냥 통과됐다"고 느끼는 원인이었다 — auth 계정은 이미 있고
      // 프로필만 없는 상태라 재클릭 시 복구 경로를 타서 결과적으로는 성공했던 것.
      if (profileError) {
        console.warn("[InstructorSignupForm] 프로필 저장 1차 실패, 1.2초 후 자동 재시도:", profileError);
        await sleep(1200);
        const retry = await supabase.from("profiles").insert(instructorProfilePayload);
        profileError = retry.error;
      }

      if (profileError) {
        toast({ title: "프로필 생성에 실패했습니다", description: profileError.message, variant: "destructive" });
        return;
      }

      await addInstructorSignup({
        name,
        phone,
        gender,
        bio,
        licenseFileNames: licenseFiles.map((f) => f.name),
        signatureDataUrl: signature,
        pledgeSigned: true,
        settlementPledgeAgreed: true,
      });
      toast({ title: "인증 강사 회원가입이 접수되었습니다!", description: "관리자 검토 후 인증배지가 부여됩니다. 홈 화면으로 이동합니다." });
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <OnboardingProgress step={step} totalSteps={TOTAL_STEPS} label={STEP_LABELS[step - 1]} />

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ins-email">이메일</Label>
            <Input
              id="ins-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="instructor@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ins-password">비밀번호</Label>
            <Input
              id="ins-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상 입력해주세요"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ins-password-confirm">비밀번호 확인</Label>
            <Input
              id="ins-password-confirm"
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
            <Label htmlFor="ins-name">이름</Label>
            <Input id="ins-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ins-phone">휴대폰 번호</Label>
            <Input
              id="ins-phone"
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
          <div className="space-y-1.5">
            <Label htmlFor="ins-bio">강사 소개</Label>
            <Textarea
              id="ins-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="보유 자격증, 경력, 전문 지역 등을 소개해주세요"
            />
          </div>
          <div className="space-y-1.5">
            <Label>신분증 사본 업로드 (필수)</Label>
            <FileDropzone label="신분증 사본" accept="application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.heic,.heif" onFilesChange={setIdFiles} />
          </div>
          <div className="space-y-3 rounded-xl border border-border p-3">
            <Label className="text-sm font-semibold">정산 계좌 정보 (필수)</Label>
            <p className="text-xs text-muted-foreground">
              정산금을 입금받을 본인 명의 계좌 정보를 입력해주세요.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="ins-bank-name">은행명</Label>
              <Input
                id="ins-bank-name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="예: 국민은행"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ins-account-holder">예금주명</Label>
              <Input
                id="ins-account-holder"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="계좌 명의자 이름"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ins-account-number">계좌번호</Label>
              <Input
                id="ins-account-number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="'-' 없이 숫자만 입력"
              />
            </div>
            <div className="space-y-1.5">
              <Label>통장 사본 업로드 (필수)</Label>
              <FileDropzone
                label="통장 사본"
                accept="application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.heic,.heif"
                onFilesChange={setBankbookFiles}
              />
            </div>
          </div>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={agreedTerms}
              onCheckedChange={(v) => setAgreedTerms(v === true)}
              className="mt-0.5"
            />
            <span>ALL BLUE 이용약관 및 개인정보처리방침에 동의합니다. (필수)</span>
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-1.5">
          <Label>강사 자격증 / 면허 서류 업로드 (필수)</Label>
          <FileDropzone
            label="강사 자격증 / 면허 서류"
            multiple
            maxFiles={3}
            accept="application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.heic,.heif"
            onFilesChange={setLicenseFiles}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-1.5">
          <Label>보험 증서 업로드 (선택)</Label>
          <FileDropzone
            label="다이빙 강사 배상책임보험 증서"
            multiple
            maxFiles={2}
            accept="application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.heic,.heif"
            onFilesChange={setInsuranceFiles}
          />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <div className="space-y-2 rounded-xl border-2 border-primary/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">플랫폼 윤리강령</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-muted-foreground">
              {ETHICS_CODE.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <label className="flex items-start gap-2.5 rounded-lg border border-primary/40 bg-secondary/40 p-3 text-sm">
            <Checkbox
              checked={ethicsAgreed}
              onCheckedChange={(checked) => setEthicsAgreed(checked === true)}
              className="mt-0.5 shrink-0"
            />
            <span className="text-foreground">위 윤리강령을 확인했습니다.</span>
          </label>
        </div>
      )}

      {step === 5 && (
        <PledgeAgreement
          signerName={pledgeSignerName}
          onSignerNameChange={setPledgeSignerName}
          agreed={pledgeAgreed}
          onAgreedChange={setPledgeAgreed}
          signature={signature}
          onSignatureChange={setSignature}
        />
      )}

      <div className="flex gap-2 pt-1">
        {step > 1 && (
          <Button type="button" variant="outline" className="flex-1" onClick={handleBack}>
            이전
          </Button>
        )}
        {step < TOTAL_STEPS - 1 ? (
          <Button type="button" className="flex-1" onClick={handleNext}>
            다음
          </Button>
        ) : (
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? "제출 중..." : "인증 강사로 가입 신청하기 (관리자 승인 대기)"}
          </Button>
        )}
      </div>
    </form>
  );
}
