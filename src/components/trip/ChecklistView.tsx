import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, EyeOff, RotateCcw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GROUP_LABEL, progressPercent, type ChecklistGroup, type ChecklistItem, type ChecklistProgress } from "@/lib/packingChecklist";
import { cn } from "@/lib/utils";

export type ChecklistRowItem = ChecklistItem & { checked: boolean };

export interface ChecklistSectionView {
  group: ChecklistGroup;
  items: ChecklistRowItem[];
  /** 섹션 안내 한 줄 (예: 수온별 슈트 문구, 대여 포함 문구). 없으면 표시하지 않는다. */
  note?: string;
}

export interface InstructorInfo {
  name: string;
  avatarUrl?: string;
}

/**
 * 준비물 본문: 진행률 막대, 카테고리 아코디언, 숨긴 항목, 본인 추가 버튼.
 * 체크한 항목은 위치가 바뀌지 않고 muted로만 바뀐다(취소선 없음). 섹션은 모두 체크되면 자동으로 접힌다.
 */
export function ChecklistView({
  sections,
  progress,
  hiddenItems,
  instructor,
  onToggle,
  onHide,
  onRestore,
  onAddOwn,
  busy = false,
}: {
  sections: ChecklistSectionView[];
  progress: ChecklistProgress;
  hiddenItems: ChecklistItem[];
  instructor?: InstructorInfo;
  onToggle: (key: string, next: boolean) => void;
  onHide: (key: string) => void;
  onRestore: (key: string) => void;
  onAddOwn: () => void;
  busy?: boolean;
}) {
  const percent = progressPercent(progress);
  const left = progress.total - progress.done;
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-[13px] text-muted-foreground">
          {progress.total > 0 && left === 0 ? "모든 준비물을 챙기셨어요." : `${left}개 남았어요. 항목을 누르면 체크돼요.`}
        </p>
      </div>

      {sections.map((section) => (
        <ChecklistSection
          key={section.group}
          section={section}
          instructor={section.group === "instructor" ? instructor : undefined}
          onToggle={onToggle}
          onHide={onHide}
          busy={busy}
        />
      ))}

      {hiddenItems.length > 0 && <HiddenList items={hiddenItems} onRestore={onRestore} busy={busy} />}

      <button
        type="button"
        onClick={onAddOwn}
        className="flex h-11 w-full items-center justify-center rounded-xl border border-dashed border-border text-[15px] font-semibold text-foreground transition-colors hover:bg-secondary/60"
      >
        내 준비물 추가
      </button>
    </div>
  );
}

function ChecklistSection({
  section,
  instructor,
  onToggle,
  onHide,
  busy,
}: {
  section: ChecklistSectionView;
  instructor?: InstructorInfo;
  onToggle: (key: string, next: boolean) => void;
  onHide: (key: string) => void;
  busy: boolean;
}) {
  const { items } = section;
  const done = items.filter((i) => i.checked).length;
  const allChecked = items.length > 0 && done === items.length;
  const [open, setOpen] = useState(!allChecked);
  const wasAllChecked = useRef(allChecked);

  // 모두 체크되는 순간에만 접는다. 사용자가 다시 펼치면 그대로 둔다.
  useEffect(() => {
    if (!wasAllChecked.current && allChecked) setOpen(false);
    wasAllChecked.current = allChecked;
  }, [allChecked]);

  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center gap-3 text-left"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-[16px] font-semibold text-foreground">{GROUP_LABEL[section.group]}</h2>
          {instructor && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 border border-border">
                <AvatarImage src={instructor.avatarUrl} alt={instructor.name} />
                <AvatarFallback className="bg-primary text-[13px] text-primary-foreground">{instructor.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-[13px] text-muted-foreground">{instructor.name} 강사님이 꼭 챙겨달래요</span>
            </div>
          )}
        </div>
        <span className="shrink-0 text-[13px] font-semibold text-muted-foreground">
          {done}/{items.length}
        </span>
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          {section.note && <p className="text-[13px] text-muted-foreground">{section.note}</p>}
          <ul className="space-y-2">
            {items.map((item) => (
              <ChecklistRow key={item.key} item={item} onToggle={onToggle} onHide={onHide} busy={busy} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function ChecklistRow({
  item,
  onToggle,
  onHide,
  busy,
}: {
  item: ChecklistRowItem;
  onToggle: (key: string, next: boolean) => void;
  onHide: (key: string) => void;
  busy: boolean;
}) {
  return (
    <li
      className={cn(
        "flex min-h-[52px] items-center rounded-xl border border-border transition-colors",
        item.checked ? "bg-secondary/40" : "bg-card",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={item.checked}
        disabled={busy}
        onClick={() => onToggle(item.key, !item.checked)}
        className="flex min-h-[52px] min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left disabled:opacity-60"
      >
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
            item.checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
          )}
        >
          {item.checked && <Check className="h-3.5 w-3.5" />}
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 text-[16px] font-semibold",
            item.checked ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {item.label}
        </span>
        {item.required && !item.checked && (
          <span className="shrink-0 text-[13px] font-semibold text-[hsl(32_95%_32%)] dark:text-[hsl(38_95%_68%)]">필수</span>
        )}
      </button>
      <button
        type="button"
        onClick={() => onHide(item.key)}
        disabled={busy}
        aria-label={`${item.label} 숨기기`}
        className="mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-60"
      >
        <EyeOff className="h-5 w-5" />
      </button>
    </li>
  );
}

function HiddenList({
  items,
  onRestore,
  busy,
}: {
  items: ChecklistItem[];
  onRestore: (key: string) => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between text-[15px] font-semibold text-muted-foreground"
      >
        숨긴 항목 {items.length}개 보기
        <ChevronDown className={cn("h-5 w-5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.key} className="flex min-h-[52px] items-center gap-3 rounded-xl border border-dashed border-border px-4 py-2">
              <span className="min-w-0 flex-1 text-[15px] text-muted-foreground">{item.label}</span>
              <button
                type="button"
                onClick={() => onRestore(item.key)}
                disabled={busy}
                aria-label={`${item.label} 복구`}
                className="flex h-11 items-center gap-1 rounded-full px-3 text-[13px] font-semibold text-primary dark:text-primary-glow disabled:opacity-60"
              >
                <RotateCcw className="h-4 w-4" />
                복구
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
