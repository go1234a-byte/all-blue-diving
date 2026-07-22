import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MonthMultiSelect } from "@/components/search/MonthMultiSelect";
import { COUNTRIES_SITES } from "@/lib/constants";
import { useAppData } from "@/contexts/AppDataContext";
import type { ActivityType } from "@/types";

export interface SearchFormValues {
  query: string;
  months: number[];
  activityTypes: ActivityType[];
}

interface SearchFormProps {
  initial?: Partial<SearchFormValues>;
  compact?: boolean;
}

interface Suggestion {
  label: string;
  type: "country" | "site";
}

/**
 * 여행지 검색 — 국가/사이트를 목록에서 고르는 대신 타이핑으로 검색한다.
 * 입력 중에는 기존 국가/사이트 목록 + 실제 등록된 투어 데이터를 기반으로
 * 연관 검색어(입력 중)/추천 검색어(입력 전) 드롭다운을 보여준다.
 */
export function SearchForm({ initial, compact = false }: SearchFormProps) {
  const navigate = useNavigate();
  const { tours } = useAppData();
  const [query, setQuery] = useState(initial?.query ?? "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [months, setMonths] = useState<number[]>(initial?.months ?? []);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(
    initial?.activityTypes ?? [],
  );

  const allSuggestions = useMemo<Suggestion[]>(() => {
    const seen = new Set<string>();
    const list: Suggestion[] = [];
    const addCountry = (label: string) => {
      const key = `country:${label}`;
      if (!label || seen.has(key)) return;
      seen.add(key);
      list.push({ label, type: "country" });
    };
    const addSite = (label: string) => {
      const key = `site:${label}`;
      if (!label || seen.has(key)) return;
      seen.add(key);
      list.push({ label, type: "site" });
    };
    Object.entries(COUNTRIES_SITES).forEach(([country, sites]) => {
      addCountry(country);
      sites.forEach(addSite);
    });
    tours.forEach((t) => {
      addCountry(t.country);
      addSite(t.site);
    });
    return list;
  }, [tours]);

  const popularSuggestions = allSuggestions.slice(0, 8);

  const filteredSuggestions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return popularSuggestions;
    return allSuggestions.filter((s) => s.label.toLowerCase().includes(trimmed)).slice(0, 8);
  }, [query, allSuggestions, popularSuggestions]);

  const toggleActivity = (type: ActivityType) => {
    setActivityTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const runSearch = (q: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (months.length) params.set("months", months.join(","));
    if (activityTypes.length) params.set("activities", activityTypes.join(","));
    navigate(`/search?${params.toString()}`);
  };

  const handleSelectSuggestion = (s: Suggestion) => {
    setQuery(s.label);
    setShowSuggestions(false);
    runSearch(s.label);
  };

  return (
    <div className="accent-top-ocean space-y-4 overflow-hidden rounded-2xl bg-card p-4 shadow-ocean">
      <div className="relative space-y-1.5">
        <Label className="text-xs text-muted-foreground">여행지 검색</Label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // 목록 클릭(onMouseDown)이 먼저 처리되도록 살짝 지연 후 닫는다.
              setTimeout(() => setShowSuggestions(false), 120);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setShowSuggestions(false);
                runSearch(query);
              }
            }}
            placeholder="국가, 지역, 다이브 사이트로 검색 (예: 세부, 발리)"
            className="pl-9"
          />
        </div>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <p className="px-3 pt-2 text-[11px] font-medium text-muted-foreground">
              {query.trim() ? "연관 검색어" : "추천 검색어"}
            </p>
            <ul className="max-h-56 overflow-y-auto py-1">
              {filteredSuggestions.map((s) => (
                <li key={`${s.type}-${s.label}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectSuggestion(s)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-secondary"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{s.label}</span>
                    <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                      {s.type === "country" ? "국가" : "다이브 사이트"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">출발 월 (복수 선택 가능)</Label>
        <MonthMultiSelect value={months} onChange={setMonths} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">액티비티 종류</Label>
        <div className="grid h-10 grid-cols-2 items-center gap-3">
          <label className="flex items-center gap-1.5 text-sm">
            <Checkbox
              checked={activityTypes.includes("scuba")}
              onCheckedChange={() => toggleActivity("scuba")}
            />
            스쿠버다이빙
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <Checkbox
              checked={activityTypes.includes("freediving")}
              onCheckedChange={() => toggleActivity("freediving")}
            />
            프리다이빙
          </label>
        </div>
      </div>

      <Button
        className="w-full gap-2"
        size={compact ? "default" : "lg"}
        onClick={() => {
          setShowSuggestions(false);
          runSearch(query);
        }}
      >
        <SearchIcon className="h-4 w-4" />
        투어 검색하기
      </Button>
    </div>
  );
}
