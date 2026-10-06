import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MAX_INSTRUCTOR_ITEMS, MAX_ITEM_LABEL_LENGTH, type ChecklistItem } from "@/lib/packingChecklist";

/**
 * 강사 준비물 편집기 (화면 전용). 항목 이름 수정, 필수 토글, 삭제, 추가. 저장 호출은 바깥에서 한다.
 * 항목이 하나도 없으면 다이버에게 리마인드가 가지 않는다는 안내를 보여준다.
 */
export function ChecklistDraftEditor({
  items,
  onChange,
  onSave,
  saving,
  dirty,
  showSave = true,
}: {
  items: ChecklistItem[];
  onChange: (next: ChecklistItem[]) => void;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
  /** 생성 폼처럼 바깥에서 함께 저장할 때는 false */
  showSave?: boolean;
}) {
  const update = (index: number, patch: Partial<ChecklistItem>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const addItem = () => {
    const key = `ins-${Date.now().toString(36)}-${items.length}`;
    onChange([...items, { key, label: "", group: "instructor", required: false }]);
  };

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="space-y-1">
        <h2 className="text-[18px] font-bold text-foreground">준비물 체크리스트</h2>
        <p className="text-[13px] text-muted-foreground">
          다이버 화면의 "강사님 요청"에 보여요. 출발 7일·1일 전 아직 챙기지 않은 다이버에게 알림도 가요.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-center text-[15px] text-muted-foreground">아직 추가한 준비물이 없어요.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={item.key} className="flex items-center gap-2">
              <Input
                value={item.label}
                maxLength={MAX_ITEM_LABEL_LENGTH}
                onChange={(e) => update(index, { label: e.target.value })}
                placeholder="예: 여권 또는 신분증"
                aria-label={`${index + 1}번 준비물 이름`}
                className="h-11 min-w-0 flex-1 text-[15px]"
              />
              <button
                type="button"
                role="checkbox"
                aria-checked={item.required}
                aria-label={`${index + 1}번 필수 항목`}
                onClick={() => update(index, { required: !item.required })}
                className={cn(
                  "h-11 shrink-0 rounded-full border px-3 text-[13px] font-semibold transition-colors",
                  item.required
                    ? "border-warning bg-warning/15 text-[hsl(32_95%_32%)] dark:text-[hsl(38_95%_68%)]"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                필수
              </button>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                aria-label={`${index + 1}번 준비물 삭제`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          className="h-11 gap-1.5 rounded-xl px-4 text-[15px] font-semibold"
          onClick={addItem}
          disabled={items.length >= MAX_INSTRUCTOR_ITEMS}
        >
          <Plus className="h-4 w-4" />
          항목 추가
        </Button>
        {showSave && (
          <Button className="h-11 rounded-xl px-6 text-[15px] font-semibold" onClick={onSave} disabled={!dirty || saving}>
            {saving ? "저장 중..." : "체크리스트 저장"}
          </Button>
        )}
      </div>
    </section>
  );
}
