import { AlertTriangle, ShieldAlert } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { usePolicies } from "@/hooks/use-policies";
import { cn } from "@/lib/utils";
import type { Policy } from "@/types";

interface PolicyDisclosureProps {
  className?: string;
  defaultOpen?: string[];
}

function PolicySection({
  value,
  label,
  violationPolicies,
  enforcementPolicies,
}: {
  value: string;
  label: string;
  violationPolicies: Policy[];
  enforcementPolicies: Policy[];
}) {
  if (violationPolicies.length === 0 && enforcementPolicies.length === 0) return null;

  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="text-sm font-semibold text-foreground">{label}</AccordionTrigger>
      <AccordionContent className="space-y-3">
        <ul className="space-y-1.5">
          {violationPolicies.map((policy) => (
            <li key={policy.id} className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
              <span>
                <span className="font-medium text-foreground">{policy.title}</span>
                {policy.description ? ` — ${policy.description}` : ""}
              </span>
            </li>
          ))}
        </ul>
        {enforcementPolicies.map((policy) => (
          <div
            key={policy.id}
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
          >
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{policy.description}</span>
          </div>
        ))}
      </AccordionContent>
    </AccordionItem>
  );
}

/**
 * ALL BLUE 플랫폼 정책 고지 컴포넌트.
 * Enter Cloud `policies` 테이블에서 위반사항/제재단계를 조회해 노출한다.
 * (환불 규정은 체크아웃의 "취소 및 환불 규정" 카드에서 별도로 고지하므로 중복을 피하기 위해 여기서는 제외한다.)
 * 투어 상세, 체크아웃, 마이페이지 등 결제/약관 동의가 필요한 모든 지점에서 재사용된다.
 *
 * 다이버가 투어 상세에서 이 정책을 볼 때 강사 전용 위반/제재 내용만 보이던 문제를 바로잡기 위해,
 * "다이버 위반 사항 및 제재 정책"과 "강사 위반 사항 및 제재 정책"을 별도 섹션으로 나눠 둘 다 보여준다.
 * (violation_instructor/enforcement_instructor 카테고리가 비어 있으면 마이그레이션 이전 데이터인
 * violation/enforcement 레거시 카테고리를 강사 항목으로 대신 사용한다.)
 */
export function PolicyDisclosure({ className, defaultOpen = [] }: PolicyDisclosureProps) {
  const { getByCategory, loading } = usePolicies();

  const diverViolations = getByCategory("violation_diver");
  const diverEnforcements = getByCategory("enforcement_diver");

  const legacyViolations = getByCategory("violation");
  const legacyEnforcements = getByCategory("enforcement");
  const instructorViolations = getByCategory("violation_instructor").length
    ? getByCategory("violation_instructor")
    : legacyViolations;
  const instructorEnforcements = getByCategory("enforcement_instructor").length
    ? getByCategory("enforcement_instructor")
    : legacyEnforcements;

  if (loading) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground", className)}>
        정책 정보를 불러오는 중...
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      <Accordion type="multiple" defaultValue={defaultOpen} className="px-4">
        <PolicySection
          value="violation_diver"
          label="다이버 위반 사항 및 제재 정책"
          violationPolicies={diverViolations}
          enforcementPolicies={diverEnforcements}
        />
        <PolicySection
          value="violation_instructor"
          label="강사 위반 사항 및 제재 정책"
          violationPolicies={instructorViolations}
          enforcementPolicies={instructorEnforcements}
        />
      </Accordion>
    </div>
  );
}
