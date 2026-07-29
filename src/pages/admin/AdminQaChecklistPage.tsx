import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  QA_CHECKLIST_ITEMS,
  QA_CHECKLIST_CATEGORIES,
  QA_CHECKLIST_STATUS_OPTIONS,
  type QaChecklistStatus,
} from "@/lib/qaChecklistData";

interface ResultRow {
  status: QaChecklistStatus;
  note: string;
}

const DEFAULT_RESULT: ResultRow = { status: "미확인", note: "" };

const STATUS_BADGE_CLASS: Record<QaChecklistStatus, string> = {
  미확인: "bg-secondary text-secondary-foreground",
  Pass: "bg-emerald-100 text-emerald-700",
  Fail: "bg-red-100 text-red-700",
  "N/A": "bg-slate-100 text-slate-500",
  진행중: "bg-amber-100 text-amber-700",
};

const PRIORITY_BADGE_CLASS: Record<string, string> = {
  상: "bg-red-50 text-red-600 border border-red-200",
  중: "bg-amber-50 text-amber-600 border border-amber-200",
  하: "bg-emerald-50 text-emerald-600 border border-emerald-200",
};

const AdminQaChecklistPage = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<Record<number, ResultRow>>({});
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"전체" | QaChecklistStatus>("전체");
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("qa_checklist_results")
        .select("item_id, status, note");
      if (!active) return;
      if (error) {
        toast({ title: "체크리스트 결과를 불러오지 못했습니다", description: error.message, variant: "destructive" });
      } else if (data) {
        const map: Record<number, ResultRow> = {};
        for (const row of data as { item_id: number; status: string; note: string | null }[]) {
          map[row.item_id] = {
            status: (row.status as QaChecklistStatus) ?? "미확인",
            note: row.note ?? "",
          };
        }
        setResults(map);
      }
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [toast]);

  const getResult = (id: number): ResultRow => results[id] ?? DEFAULT_RESULT;

  const persist = async (itemId: number, next: ResultRow) => {
    setSavingIds((prev) => new Set(prev).add(itemId));
    const { error } = await supabase.from("qa_checklist_results").upsert(
      {
        item_id: itemId,
        status: next.status,
        note: next.note || null,
        checked_at: next.status === "미확인" ? null : new Date().toISOString(),
      },
      { onConflict: "item_id" },
    );
    setSavingIds((prev) => {
      const copy = new Set(prev);
      copy.delete(itemId);
      return copy;
    });
    if (error) {
      toast({ title: "저장 실패", description: error.message, variant: "destructive" });
    }
  };

  const handleStatusChange = (itemId: number, status: QaChecklistStatus) => {
    const next = { ...getResult(itemId), status };
    setResults((prev) => ({ ...prev, [itemId]: next }));
    void persist(itemId, next);
  };

  const handleNoteBlur = (itemId: number, note: string) => {
    const current = getResult(itemId);
    if (current.note === note) return;
    const next = { ...current, note };
    setResults((prev) => ({ ...prev, [itemId]: next }));
    void persist(itemId, next);
  };

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return QA_CHECKLIST_ITEMS.filter((it) => {
      if (statusFilter !== "전체" && getResult(it.id).status !== statusFilter) return false;
      if (!keyword) return true;
      return (
        it.item.toLowerCase().includes(keyword) ||
        it.category.toLowerCase().includes(keyword) ||
        it.subFeature.toLowerCase().includes(keyword)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, results]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof QA_CHECKLIST_ITEMS>();
    for (const cat of QA_CHECKLIST_CATEGORIES) map.set(cat, []);
    for (const it of filteredItems) {
      map.get(it.category)?.push(it);
    }
    return map;
  }, [filteredItems]);

  const overall = useMemo(() => {
    const total = QA_CHECKLIST_ITEMS.length;
    let pass = 0;
    let fail = 0;
    let na = 0;
    let checked = 0;
    let inProgress = 0;
    for (const it of QA_CHECKLIST_ITEMS) {
      const status = getResult(it.id).status;
      if (status === "Pass") {
        pass++;
        checked++;
      } else if (status === "Fail") {
        fail++;
        checked++;
      } else if (status === "N/A") {
        na++;
        checked++;
      } else if (status === "진행중") {
        inProgress++;
      }
    }
    return { total, pass, fail, na, checked, inProgress };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  const categoryStats = (items: typeof QA_CHECKLIST_ITEMS) => {
    const total = items.length;
    let done = 0;
    let fail = 0;
    for (const it of items) {
      const status = getResult(it.id).status;
      if (status === "Pass" || status === "N/A") done++;
      if (status === "Fail") fail++;
    }
    return { total, done, fail };
  };

  useEffect(() => {
    if (search.trim()) {
      const matches = Array.from(grouped.entries())
        .filter(([, items]) => items.length > 0)
        .map(([cat]) => cat);
      setOpenCategories(matches);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        체크리스트를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="accent-top-ocean">
        <CardContent className="space-y-3 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            ALL BLUE QA 체크리스트 진행 현황
          </p>
          <Progress value={(overall.checked / overall.total) * 100} />
          <div className="grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6">
            <div className="rounded-lg bg-secondary/50 p-2">
              <p className="text-base font-bold text-foreground">{overall.total}</p>
              <p className="text-muted-foreground">전체</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2">
              <p className="text-base font-bold text-emerald-700">{overall.pass}</p>
              <p className="text-muted-foreground">Pass</p>
            </div>
            <div className="rounded-lg bg-red-50 p-2">
              <p className="text-base font-bold text-red-700">{overall.fail}</p>
              <p className="text-muted-foreground">Fail</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-base font-bold text-slate-600">{overall.na}</p>
              <p className="text-muted-foreground">N/A</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2">
              <p className="text-base font-bold text-amber-700">{overall.inProgress}</p>
              <p className="text-muted-foreground">진행중</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-2">
              <p className="text-base font-bold text-foreground">
                {overall.total - overall.checked - overall.inProgress}
              </p>
              <p className="text-muted-foreground">미확인</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="항목 검색 (예: 환불, 위시리스트, 강사...)"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="전체">전체 상태</SelectItem>
            {QA_CHECKLIST_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Accordion type="multiple" value={openCategories} onValueChange={setOpenCategories}>
        {QA_CHECKLIST_CATEGORIES.map((cat) => {
          const items = grouped.get(cat) ?? [];
          if (search.trim() && items.length === 0) return null;
          const allInCat = QA_CHECKLIST_ITEMS.filter((i) => i.category === cat);
          const stats = categoryStats(allInCat);
          return (
            <AccordionItem key={cat} value={cat} className="rounded-lg border border-border px-3">
              <AccordionTrigger className="py-3 text-sm hover:no-underline">
                <div className="flex flex-1 items-center justify-between gap-3 pr-2">
                  <span className="font-semibold text-foreground">{cat}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {stats.fail > 0 && (
                      <Badge className="bg-red-100 text-red-700">Fail {stats.fail}</Badge>
                    )}
                    <span>
                      {stats.done}/{stats.total} 완료
                    </span>
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {items.map((it) => {
                    const result = getResult(it.id);
                    const saving = savingIds.has(it.id);
                    return (
                      <div key={it.id} className="rounded-lg border border-border/70 bg-card p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant="outline" className={PRIORITY_BADGE_CLASS[it.priority]}>
                                {it.priority}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{it.subFeature}</span>
                            </div>
                            <p className="text-sm text-foreground">
                              #{it.id}. {it.item}
                            </p>
                          </div>
                          <Select
                            value={result.status}
                            onValueChange={(v) => handleStatusChange(it.id, v as QaChecklistStatus)}
                          >
                            <SelectTrigger
                              className={`h-8 w-24 shrink-0 text-xs ${STATUS_BADGE_CLASS[result.status]}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {QA_CHECKLIST_STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Textarea
                          defaultValue={result.note}
                          onBlur={(e) => handleNoteBlur(it.id, e.target.value)}
                          placeholder="비고 (선택)"
                          className="mt-2 min-h-[32px] text-xs"
                          rows={1}
                        />
                        {saving && <p className="mt-1 text-[10px] text-muted-foreground">저장 중...</p>}
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default AdminQaChecklistPage;
