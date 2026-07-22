import { AlertTriangle, ShieldAlert } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { usePolicies } from "@/hooks/use-policies";
import { cn } from "@/lib/utils";

interface PolicyDisclosureProps {
  className?: string;
  defaultOpen?: string[];
}

/**
 * ALL BLUE 플랫폼 정책 고지 컴포넌트.
 * Enter Cloud `policies` 테이블에서 위반사항/제재단계를 조회해 노출한다.
 * (환불 규정은 체크아웃의 "취소 및 환불 규정" 카드에서 별도로 고지하므로 중복을 피하기 위해 여기서는 제외한다.)
 * 투어 상세, 체크아웃, 마이페이지 등 결제/약관 동의가 필요한 모든 지점에서 재사용된다.
 */
export function PolicyDisclosure({ className, defaultOpen = [] }: PolicyDisclosureProps) {
  const { getByCategory, loading } = usePolicies();
  const violationPolicies = getByCategory("violation");
  const enforcementPolicies = getByCategory("enforcement");

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
        <AccordionItem value="violation">
          <AccordionTrigger className="text-sm font-semibold text-foreground">
            위반 사항 및 제재 정책
          </AccordionTrigger>
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
      </Accordion>
    </div>
  );
}
