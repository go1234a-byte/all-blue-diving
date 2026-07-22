import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryStarRowProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

/** 후기 작성 시 세부 평가 항목(강사/센터/투어 각 3항목)용 미니 별점 컴포넌트. */
export function CategoryStarRow({ label, value, onChange }: CategoryStarRowProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => onChange(star)} aria-label={`${label} ${star}점`}>
            <Star
              className={cn(
                "h-4 w-4 transition-colors",
                star <= value ? "text-warning" : "text-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
