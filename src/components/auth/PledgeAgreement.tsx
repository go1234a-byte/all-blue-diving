import { ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SignaturePad } from "@/components/auth/SignaturePad";
import type { InstructorBusinessType } from "@/types";

const PLEDGE_CLAUSES = [
  "허위 자격을 사용하지 않습니다.",
  "참가자의 안전을 최우선으로 합니다.",
  "플랫폼 외 거래를 유도하지 않습니다.",
  "참가자의 개인정보를 외부에 제공하지 않습니다.",
  "플랫폼 정책을 준수합니다.",
];

const SETTLEMENT_PLEDGE_TEXT =
  "선지급 정산 정책: 투어 등록 및 예약 확정 시 총 금액의 80%가 강사에게 선지급되며, 투어 완료 후 48시간 동안 사용자의 공식 이의 제기나 문제가 없을 경우 나머지 20%가 최종 정산되어 지급됩니다.";

const TAX_PLEDGE_TEXT =
  "플랫폼은 예약금 중 강사 정산분(90%)을 대리로 전달하고, 플랫폼 수수료(10%)만을 자체 매출로 처리합니다. 사업자등록이 없는 프리랜서 강사는 관련 세법(소득세법 시행령 제184조)에 따라 정산 시 사업소득세 3.3%가 원천징수된 후 실지급액이 지급됩니다. 사업자등록이 있는 개인·법인사업자 강사는 원천징수 없이 전액 정산되며, 이 경우 플랫폼에 세금계산서 또는 현금영수증을 발급해야 할 의무가 있습니다.";

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

const ENFORCEMENT_CLAUSES = ["활동 정지", "정산 보류", "영구 이용정지"];

interface PledgeAgreementProps {
  signerName: string;
  onSignerNameChange: (name: string) => void;
  businessType: InstructorBusinessType | "";
  onBusinessTypeChange: (type: InstructorBusinessType) => void;
  agreed: boolean;
  onAgreedChange: (agreed: boolean) => void;
  signature: string | undefined;
  onSignatureChange: (dataUrl: string | undefined) => void;
}

/** 인증강사 전자서약 단계: 서약 조항 + 정산·세금(원천징수) 안내 + 사업자유형 신고 + 위반 시 제재 조항 + 이름/체크박스/서명. */
export function PledgeAgreement({
  signerName,
  onSignerNameChange,
  businessType,
  onBusinessTypeChange,
  agreed,
  onAgreedChange,
  signature,
  onSignatureChange,
}: PledgeAgreementProps) {
  return (
    <div className="space-y-4 rounded-xl border-2 border-primary/40 p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">전자 서약</h3>
      </div>

      <div className="space-y-2 rounded-lg bg-secondary/50 p-3 text-sm text-foreground">
        <p className="font-medium">본인은</p>
        <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed">
          {PLEDGE_CLAUSES.map((clause) => (
            <li key={clause}>{clause}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-1.5 rounded-lg border border-primary/40 bg-primary/5 p-3 text-xs leading-relaxed text-foreground">
        <p className="font-semibold text-primary">정산 정책 안내</p>
        <p className="break-keep">{SETTLEMENT_PLEDGE_TEXT}</p>
      </div>

      <div className="space-y-2.5 rounded-lg border border-primary/40 bg-primary/5 p-3 text-xs leading-relaxed text-foreground">
        <p className="font-semibold text-primary">세금(원천징수) 안내 및 사업자 유형 신고</p>
        <p className="break-keep">{TAX_PLEDGE_TEXT}</p>
        <p className="break-keep font-medium">
          아래에서 본인의 사업자 유형을 정확히 선택해주세요. 허위로 신고할 경우 발생하는 세무상 불이익
          및 책임은 본인에게 있습니다.
        </p>

        <RadioGroup
          value={businessType}
          onValueChange={(v) => onBusinessTypeChange(v as InstructorBusinessType)}
          className="space-y-2 pt-1"
        >
          {BUSINESS_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-start gap-2.5 rounded-lg border border-border bg-background/60 p-2.5 has-[[data-state=checked]]:border-primary"
            >
              <RadioGroupItem value={option.value} id={`business-type-${option.value}`} className="mt-0.5 shrink-0" />
              <span>
                <span className="block font-medium text-foreground">{option.label}</span>
                <span className="block text-muted-foreground">{option.description}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
        <p className="font-semibold">위반 시</p>
        <ul className="list-disc space-y-1 pl-5 leading-relaxed">
          {ENFORCEMENT_CLAUSES.map((clause) => (
            <li key={clause}>{clause}</li>
          ))}
        </ul>
        <p className="pt-1 font-medium">조치에 동의합니다.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pledge-name">이름 입력</Label>
        <Input
          id="pledge-name"
          value={signerName}
          onChange={(e) => onSignerNameChange(e.target.value)}
          placeholder="본인 성명을 입력해주세요"
        />
      </div>

      <label className="flex items-start gap-2.5 rounded-lg border border-primary/40 bg-background/60 p-3 text-sm">
        <Checkbox checked={agreed} onCheckedChange={(checked) => onAgreedChange(checked === true)} className="mt-0.5 shrink-0" />
        <span className="text-foreground">
          위 서약 내용, 정산 정책, 세금(원천징수) 안내, 위반 시 제재 조치에 모두 전자동의하며, 위에서
          선택한 사업자 유형이 사실과 다름없음을 확인합니다.
        </span>
      </label>

      <div className="space-y-1.5">
        <Label>서명 완료</Label>
        <SignaturePad onChange={onSignatureChange} />
        {signature && <p className="text-xs font-medium text-success">서명이 저장되었습니다.</p>}
      </div>
    </div>
  );
}
