import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import type { InstructorBusinessType, InstructorProfile } from "@/types";

const BUSINESS_TYPE_OPTIONS: { value: InstructorBusinessType; label: string; description: string }[] = [
  {
    value: "freelancer",
    label: "프리랜서 (사업자등록 없음)",
    description: "정산 시 사업소득세 3.3%가 원천징수됩니다.",
  },
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
  const [businessType, setBusinessType] = useState<InstructorBusinessType | "">("");
  const [submitting, setSubmitting] = useState(false);

  // 이미 신고했으면 아무것도 표시하지 않는다.
  if (instructor.businessType) return null;

  const handleSubmit = async () => {
    if (!businessType) {
      toast({ title: "사업자 유형을 선택해주세요", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await updateInstructorProfile(instructor.id, { businessType });
      toast({ title: "사업자 유형이 등록되었습니다", description: "다음 정산부터 정확히 반영됩니다." });
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
        <h3 className="text-sm font-semibold text-foreground">사업자 유형 신고가 필요합니다</h3>
      </div>
      <p className="text-xs leading-relaxed text-foreground">
        정산 시 세금(원천징수) 처리를 위해 사업자 유형 신고가 필요해요. 사업자등록이 없는 프리랜서
        강사는 정산 시 사업소득세 3.3%가 원천징수된 후 지급되고, 사업자등록이 있는 개인·법인사업자
        강사는 원천징수 없이 전액 지급되는 대신 세금계산서/현금영수증 발급 의무가 있습니다. 신고
        전까지는 정산 시 원천징수가 적용되지 않으니, 실제 사실과 다름없이 신고해주세요.
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

      <Button size="sm" className="w-full" onClick={handleSubmit} disabled={submitting || !businessType}>
        {submitting ? "등록 중..." : "사업자 유형 등록"}
      </Button>
    </div>
  );
}
