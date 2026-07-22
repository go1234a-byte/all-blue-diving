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
  "신분증 인증",
  "강사 자격증 업로드",
  "보험 등록 (선택)",
  "플랫폼 윤리강령",
  "전자 서약",
  "관리자 승인",
];

const TOTAL_STEPS = STEP_LABELS.length;

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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [bio, setBio] = useState("");

  // 1) 신분증 인증
  const [idFiles, setIdFiles] = useState<File[]>([]);
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

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });

      if (signUpError || !signUpData.user) {
        toast({ title: "회원가입에 실패했습니다", description: signUpError?.message, variant: "destructive" });
        return;
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        id: signUpData.user.id,
        role: "instructor",
        name,
        phone,
        gender,
        pledge_settlement_agreed: true,
        pledge_settlement_agreed_at: new Date().toISOString(),
      });

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
            <FileDropzone label="신분증 사본" accept=".pdf,.jpg,.png" onFilesChange={setIdFiles} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-1.5">
          <Label>강사 자격증 / 면허 서류 업로드 (필수)</Label>
          <FileDropzone
            label="강사 자격증 / 면허 서류"
            multiple
            maxFiles={3}
            accept=".pdf,.jpg,.png"
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
            accept=".pdf,.jpg,.png"
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
