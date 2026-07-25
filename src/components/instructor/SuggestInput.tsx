import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SuggestInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
}

/**
 * 홈 화면 여행지 검색과 동일한 방식의 추천 입력창.
 * 타이핑하면 options 중 일치하는 항목이 드롭다운으로 추천되고, 클릭하면 바로 채워진다.
 * 목록에 없는 값도 그대로 직접 입력해서 사용할 수 있다 (제약 없음).
 */
export function SuggestInput({ value, onChange, options, placeholder, disabled }: SuggestInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = useMemo(() => {
    const trimmed = value.trim().toLowerCase();
    const base = trimmed ? options.filter((o) => o.toLowerCase().includes(trimmed)) : options;
    return base.slice(0, 8);
  }, [value, options]);

  return (
    <div className="relative">
      <Input
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => {
          // 목록 클릭(onMouseDown)이 먼저 처리되도록 살짝 지연 후 닫는다.
          setTimeout(() => setShowSuggestions(false), 120);
        }}
        placeholder={placeholder}
      />
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(opt);
                    setShowSuggestions(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-secondary"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{opt}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
