import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, List, MapPin, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TourCard } from "@/components/search/TourCard";
import { TourMapView } from "@/components/search/TourMapView";
import { FilterSidebar, DEFAULT_FILTERS, type FilterState } from "@/components/search/FilterSidebar";
import { useAppData } from "@/contexts/AppDataContext";
import { cn } from "@/lib/utils";
import type { ActivityType } from "@/types";

type SortOption = "newest" | "cheapest" | "expensive" | "rating";
type ViewMode = "list" | "map";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "최신순",
  cheapest: "가격 낮은순",
  expensive: "가격 높은순",
  rating: "평점순",
};

const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tours } = useAppData();
  const [sort, setSort] = useState<SortOption>("cheapest");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const query = searchParams.get("q")?.trim() ?? "";
  const monthsParam = searchParams.get("months");
  const activitiesParam = searchParams.get("activities");

  const clearQuery = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("q");
    navigate(`/search?${params.toString()}`);
  };

  const filteredTours = useMemo(() => {
    const months = monthsParam ? monthsParam.split(",").map(Number) : [];
    const activities = (activitiesParam ? activitiesParam.split(",") : []) as ActivityType[];
    const q = query.toLowerCase();
    return tours
      .filter(
        (t) =>
          !q ||
          t.country.toLowerCase().includes(q) ||
          t.site.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q),
      )
      .filter((t) => months.length === 0 || months.includes(new Date(t.startDate).getMonth()))
      .filter((t) => activities.length === 0 || t.activityTypes.some((a) => activities.includes(a)))
      .filter((t) => t.basePrice >= filters.priceRange[0] && t.basePrice <= filters.priceRange[1])
      .sort((a, b) => {
        if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sort === "cheapest") return a.basePrice - b.basePrice;
        if (sort === "expensive") return b.basePrice - a.basePrice;
        return b.rating - a.rating;
      });
  }, [tours, query, monthsParam, activitiesParam, filters, sort]);

  return (
    <div className="min-h-full bg-gradient-surface pb-10">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4">
          <Link to="/" className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-semibold text-foreground">검색 결과 ({filteredTours.length})</h1>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[260px_1fr]">
        <FilterSidebar filters={filters} onChange={setFilters} />

        <div className="space-y-4">
          {query && (
            <Badge variant="secondary" className="gap-1.5 pl-3 pr-1.5 py-1 text-xs font-medium">
              &quot;{query}&quot;
              <button
                type="button"
                onClick={clearQuery}
                className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-background/60"
                aria-label="검색어 지우기"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <div className="flex items-center justify-between gap-2">
            <div className="flex overflow-hidden rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium",
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
                )}
              >
                <List className="h-3.5 w-3.5" />
                목록
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium",
                  viewMode === "map" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
                )}
              >
                <MapPin className="h-3.5 w-3.5" />
                지도
              </button>
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SORT_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredTours.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              조건에 맞는 투어가 없습니다. 필터를 조정해보세요.
            </div>
          ) : viewMode === "map" ? (
            <TourMapView tours={filteredTours} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Search;
