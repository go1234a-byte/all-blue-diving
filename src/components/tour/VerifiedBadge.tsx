import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

/**
 * "플랫폼 인증강사" 신뢰 배지. 로얄블루 배경의 고정 비주얼로
 * 투어카드/상세페이지/마이페이지 등 전역에서 동일하게 사용된다.
 */
export function VerifiedBadge({ className, size = "sm" }: VerifiedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary font-semibold text-primary-foreground shadow-sm",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      <ShieldCheck className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      플랫폼 인증강사
    </span>
  );
}
