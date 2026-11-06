import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FileDropzone } from "@/components/auth/FileDropzone";
import { OnboardingProgress } from "@/components/auth/OnboardingProgress";
import { PledgeAgreement } from "@/components/auth/PledgeAgreement";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { uploadInstructorDocument, uploadInstructorDocuments } from "@/lib/uploadImage";
import { useToast } from "@/hooks/use-toast";
import { containsObjectionable, OBJECTIONABLE_BLOCKED_MESSAGE } from "@/lib/contentModeration";
import type { Gender, InstructorBusinessType } from "@/types";

interface InstructorApplicationFormProps {
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

const ETHICS_CODE = [
  "모든 참가자를 성별, 국적, 신체 조건에 관계없이 동등하게 존중합니다.",
  "다이빙 안전 수칙과 장비 점검을 철저히 준수합니다.",
  "투어 정보와 자격 사항을 사실대로 정확히 게재합니다.",
  "플랫폼을 통해 발생한 문제는 성실히 협조하여 해결합니다.",
];

/** 가입한 회원의 강사 전환 신청서. 승인 전까지 역할은 다이버로 유지되고, 승격은 DB가 승인 시점에 처리한다. */
export function InstructorApplicationForm({ onSuccess }: InstructorApplicationFormProps) {
  const { submitInstructorApplication } = useAppData();
  const { toast } = useToast();
  const { user, profile } = useRole();

  const [step, setStep] = useState(1);

  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [gender, setGender] = useState<Gender>(profile?.gender === "female" ? "female" : "male");
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
  const [businessType, setBusinessType] = useState<InstructorBusinessType | "">("");
  const [businessLicenseFiles, setBusinessLicenseFiles] = useState<File[]>([]);
  const [pledgeAgreed, setPledgeAgreed] = useState(false);
  const [signature, setSignature] = useState<string | undefined>(undefined);

  const [submitting, setSubmitting] = useState(false);

  const canGoNext = (): boolean => {
    switch (step) {
      case 1:
        if (!name.trim()) {
          toast({ title: "이름을 입력해주세요", variant: "destructive" });
          return false;
        }
        if (!phone.trim()) {
          toast({ title: "연락처를 입력해주세요", variant: "destructive" });
          return false;
        }
        if (idFiles.length === 0) {
          toast({ title: "신분증 사본을 첨부해주세요", variant: "destructive" });
          return false;
        }
        if (!bankName.trim()) {
          toast({ title: "은행명을 입력해주세요", variant: "destructive" });
          return false;
        }
        if (!accountHolder.trim()) {
          toast({ title: "예금주명을 입력해주세요", variant: "destructive" });
          return false;
        }
        if (!accountNumber.trim()) {
          toast({ title: "계좌번호를 입력해주세요", variant: "destructive" });
          return false;
        }
        if (bankbookFiles.length === 0) {
          toast({ title: "통장 사본을 첨부해주세요", variant: "destructive" });
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
    if (!user) {
      toast({ title: "로그인 후 신청할 수 있어요", variant: "destructive" });
      return;
    }
    if (!pledgeSignerName.trim()) {
      toast({ title: "서약 서명자 이름을 입력해주세요", variant: "destructive" });
      return;
    }
    if (!businessType) {
      toast({ title: "사업자 유형을 선택해주세요", variant: "destructive" });
      return;
    }
    if (businessLicenseFiles.length === 0) {
      toast({ title: "사업자등록증 사본을 첨부해주세요", variant: "destructive" });
      return;
    }
    if (!pledgeAgreed) {
      toast({ title: "전자 서약 동의 체크박스를 확인해주세요", variant: "destructive" });
      return;
    }
    if (!signature) {
      toast({ title: "서명을 입력해주세요", variant: "destructive" });
      return;
    }
    // 강사 소개는 승인 후 공개 프로필에 그대로 노출되므로 채팅·후기와 동일한
    // 1차 필터를 통과해야 한다.
    if (containsObjectionable(bio)) {
      toast({ title: OBJECTIONABLE_BLOCKED_MESSAGE, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // 서류 원본은 관리자 심사에 필요하므로 비공개 버킷에 실제로 업로드한다.
      const [idDocumentPath, bankbookPath, licenseFilePaths, businessLicensePath] = await Promise.all([
        uploadInstructorDocument(idFiles[0], user.id, "id"),
        uploadInstructorDocument(bankbookFiles[0], user.id, "bankbook"),
        uploadInstructorDocuments(licenseFiles, user.id, "license"),
        uploadInstructorDocument(businessLicenseFiles[0], user.id, "business_license"),
      ]);

      await submitInstructorApplication({
        name,
        phone,
        gender,
        bio,
        licenseFileNames: licenseFiles.map((f) => f.name),
        licenseFilePaths,
        signatureDataUrl: signature,
        pledgeSigned: true,
        businessType: businessType || undefined,
        businessLicenseFileName: businessLicenseFiles[0]?.name,
        businessLicensePath,
        settlementPledgeAgreed: true,
        bankName,
        accountHolder,
        accountNumber,
        bankbookFileName: bankbookFiles[0]?.name,
        bankbookPath,
        idDocumentPath,
      });
      toast({ title: "강사 전환 신청이 접수되었습니다!", description: "관리자 승인 후 강사 기능을 이용할 수 있어요." });
      onSuccess();
    } catch (err) {
      toast({
        title: "강사 전환 신청에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
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
            <FileDropzone label="신분증 사본" accept="application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.heic,.heif" onFilesChange={setIdFiles} value={idFiles} />
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
                value={bankbookFiles}
              />
            </div>
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
            accept="application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.heic,.heif"
            onFilesChange={setLicenseFiles}
            value={licenseFiles}
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
            value={insuranceFiles}
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
          businessType={businessType}
          onBusinessTypeChange={setBusinessType}
          businessLicenseFiles={businessLicenseFiles}
          onBusinessLicenseFilesChange={setBusinessLicenseFiles}
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
          // key를 달리 줘서 "다음"/"신청하기" 버튼이 같은 DOM 노드를 재사용하지 않게 한다 —
          // 재사용하면 마지막 단계로 넘어가는 클릭이 그대로 form submit까지 터뜨린다.
          <Button key="next" type="button" className="flex-1" onClick={handleNext}>
            다음
          </Button>
        ) : (
          <Button key="submit" type="submit" className="flex-1" disabled={submitting}>
            {submitting ? "제출 중..." : "강사 전환 신청하기 (관리자 승인 대기)"}
          </Button>
        )}
      </div>
    </form>
  );
}
