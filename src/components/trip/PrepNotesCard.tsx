import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** 강사 준비 메모 — 회색 안내 카드, 기본은 접혀 있다. */
export function PrepNotesCard({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-xl bg-secondary/60 px-4 py-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between text-left text-[15px] font-semibold text-foreground"
      >
        강사님 준비 메모
        <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <p className="whitespace-pre-line pb-3 text-[15px] leading-relaxed text-foreground">{text}</p>}
    </section>
  );
}
