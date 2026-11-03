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

  // 스크롤 위치에 따라 활성 탭을 바꾼다: 위쪽 고정 영역(헤더+탭, 약 120px) 아래로 막 지나간 마지막 섹션이 현재 위치.
  // 어느 섹션에도 닿지 않은 맨 위에서는 첫 탭, 페이지 끝에 닿으면(마지막 섹션이 짧아 올라오지 못할 때) 마지막 탭.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      if (clicking.current || tabs.length === 0) return;
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        setActive(tabs[tabs.length - 1].id);
        return;
      }
      let current = tabs[0].id;
      for (const t of tabs) {
        const el = document.getElementById(t.id);
        if (el && el.getBoundingClientRect().top <= 130) current = t.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
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
