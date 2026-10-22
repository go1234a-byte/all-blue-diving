import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileDropzone } from "@/components/auth/FileDropzone";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { uploadInstructorDocument } from "@/lib/uploadImage";
import { hasBusinessLicense } from "@/lib/businessLicense";
import type { InstructorBusinessType, InstructorProfile } from "@/types";

const BUSINESS_TYPE_OPTIONS: { value: InstructorBusinessType; label: string; description: string }[] = [
  {
    value: "individual",
    label: "개인사업자",
    description: "원천징수 없이 전액 정산되며, 세금계산서/현금영수증 발급 의무가 있습니다.",
  },
  {
    value: "corporation",
    label: "법인사업자",
    description: "원천징수 없이 전액 정산되며, 세금계산서 발급 의무가 있습니다.",
  },
];

interface InstructorBusinessTypeBannerProps {
  instructor: InstructorProfile;
}

/**
 * 정산 시 원천징수(3.3%) 적용 여부를 결정하는 사업자 유형을 아직 신고하지 않은 강사에게
 * 노출되는 필수 신고 배너. 신규 가입은 전자서약(PledgeAgreement) 단계에서 이미 수집하지만,
 * 그 이전에 가입한 기존 강사들은 이 값이 비어 있어 정산 시 원천징수가 전혀 계산되지 않는
 * 세무 리스크가 있다 — 이를 메워주는 화면.
 */
export function InstructorBusinessTypeBanner({ instructor }: InstructorBusinessTypeBannerProps) {
  const { updateInstructorProfile } = useAppData();
  const { toast } = useToast();
  // 예전 가입의 프리랜서는 더 이상 고를 수 없으니 빈 값부터 시작한다.
  const [businessType, setBusinessType] = useState<InstructorBusinessType | "">(
    instructor.businessType && instructor.businessType !== "freelancer" ? instructor.businessType : "",
  );
  const [businessLicenseFiles, setBusinessLicenseFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 사업자·법인으로 신고하고 등록증까지 냈으면 표시하지 않는다. 미신고, 예전 프리랜서,
  // 등록증 미제출 강사에게는 계속 보인다.
  if (hasBusinessLicense(instructor)) return null;

  const handleSubmit = async () => {
    if (!businessType) {
      toast({ title: "사업자 유형을 선택해주세요", variant: "destructive" });
      return;
    }
    if (businessLicenseFiles.length === 0) {
      toast({ title: "사업자등록증 사본을 첨부해주세요", variant: "destructive" });
      return;
    }
    if (!instructor.profileId) {
      toast({ title: "로그인 정보를 확인할 수 없습니다", description: "다시 로그인 후 시도해주세요.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const businessLicensePath = await uploadInstructorDocument(
        businessLicenseFiles[0],
        instructor.profileId,
        "business_license",
      );
      await updateInstructorProfile(instructor.id, {
        businessType,
        businessLicenseFileName: businessLicenseFiles[0].name,
        businessLicensePath,
      });
      toast({ title: "사업자등록증이 제출되었습니다", description: "관리자 확인 후 반영됩니다." });
    } catch (err) {
      toast({
        title: "등록에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border-2 border-destructive/50 bg-destructive/5 p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <h3 className="text-sm font-semibold text-foreground">사업자등록증 제출이 필요합니다</h3>
      </div>
      <p className="text-xs leading-relaxed text-foreground">
        정산을 위해 사업자 유형 신고와 사업자등록증 제출이 필요해요. 인증 강사는 사업자등록증을 보유한
        개인·법인사업자만 활동할 수 있으며, 원천징수 없이 전액 지급되는 대신 세금계산서/현금영수증
        발급 의무가 있습니다. 실제 사실과 다름없이 신고해주세요.
      </p>

      <RadioGroup
        value={businessType}
        onValueChange={(v) => setBusinessType(v as InstructorBusinessType)}
        className="space-y-2"
      >
        {BUSINESS_TYPE_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex items-start gap-2.5 rounded-lg border border-border bg-background/80 p-2.5 has-[[data-state=checked]]:border-destructive"
          >
            <RadioGroupItem value={option.value} id={`mypage-business-type-${option.value}`} className="mt-0.5 shrink-0" />
            <span>
              <span className="block text-sm font-medium text-foreground">{option.label}</span>
              <span className="block text-xs text-muted-foreground">{option.description}</span>
            </span>
          </label>
        ))}
      </RadioGroup>

      {businessType && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground">사업자등록증 사본 (필수)</p>
          <FileDropzone
            label="사업자등록증 사본"
            accept="application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.heic,.heif"
            onFilesChange={setBusinessLicenseFiles}
            value={businessLicenseFiles}
          />
        </div>
      )}

      <Button
        size="sm"
        className="w-full"
        onClick={handleSubmit}
        disabled={submitting || !businessType || businessLicenseFiles.length === 0}
      >
        {submitting ? "제출 중..." : "사업자등록증 제출"}
      </Button>
    </div>
  );
}
