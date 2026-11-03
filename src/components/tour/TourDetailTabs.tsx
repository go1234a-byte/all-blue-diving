import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface DetailTab {
  id: string;
  label: string;
}

/** 헤더(h-14 + 안전영역) 바로 아래에 붙는 고정 탭. 현재 보이는 섹션을 파란 밑줄로 표시하고, 누르면 그 섹션으로 이동한다. */
export function TourDetailTabs({ tabs }: { tabs: DetailTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const barRef = useRef<HTMLDivElement>(null);
  const clicking = useRef(false);

  // 스크롤 위치에 따라 활성 탭을 바꾼다(헤더+탭 높이만큼 위쪽 여백을 둔 관찰 영역).
  useEffect(() => {
    const els = tabs.map((t) => document.getElementById(t.id)).filter((e): e is HTMLElement => !!e);
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (clicking.current) return;
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-112px 0px -60% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [tabs]);

  // 맨 아래 섹션(환불·정책)은 짧아서 화면 위까지 올라오지 못한다 — 페이지 끝에 닿으면 마지막 탭을 활성으로 본다.
  useEffect(() => {
    const last = tabs[tabs.length - 1]?.id;
    if (!last) return;
    const onScroll = () => {
      if (clicking.current) return;
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) setActive(last);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [tabs]);

  // 활성 탭이 가로 스크롤 안에서 보이게 맞춘다.
  useEffect(() => {
    barRef.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`)?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  const go = (id: string) => {
    setActive(id);
    clicking.current = true;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => (clicking.current = false), 1100);
  };

  if (tabs.length < 2) return null;
  return (
    <nav
      aria-label="상세 정보 이동"
      className="sticky z-20 -mx-4 border-b border-border bg-card/95 backdrop-blur md:mx-0 md:rounded-xl md:border"
      style={{ top: "calc(3.5rem + env(safe-area-inset-top))" }}
    >
      <div ref={barRef} className="flex overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            data-tab={t.id}
            onClick={() => go(t.id)}
            aria-current={active === t.id ? "true" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-3.5 py-3 text-sm transition-colors",
              active === t.id ? "border-primary font-bold text-primary" : "border-transparent text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
