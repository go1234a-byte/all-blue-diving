import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { DIVE_BASICS, DIVE_BASICS_NOTICE } from "@/content/diveBasics";
import { handleImageFallback } from "@/lib/image";

/** /guide — 다이빙 기초·안전 글 모음. 홈 "처음이라면 읽어 보세요"에서 #글id 로 들어온다. */
const GuidePage = () => {
  usePageMeta({
    title: "다이빙 기초·안전 가이드",
    description: "자격증 수심, 다이빙 후 비행, 프리다이빙 버디 등 떠나기 전에 알아 둘 것들을 출처와 함께 정리했어요.",
    path: "/guide",
  });
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    // 앱의 스크롤 복원이 끝난 뒤에 이동해야 한다(바로 하면 맨 위로 되돌아감).
    const id = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView(), 150);
    return () => window.clearTimeout(id);
  }, [hash]);

  return (
    <div className="min-h-screen bg-background" style={{ wordBreak: "keep-all" }}>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">다이빙 기초·안전 가이드</h1>
        <p className="mb-10 text-base text-muted-foreground">떠나기 전에 알아 둘 것들. {DIVE_BASICS_NOTICE}</p>

        <div className="space-y-14">
          {DIVE_BASICS.map((g) => (
            <article key={g.id} id={g.id} className="scroll-mt-20">
              <img src={g.image} alt="" onError={handleImageFallback} loading="lazy" className="mb-5 aspect-[16/9] w-full rounded-2xl object-cover" />
              <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">{g.title}</h2>
              <div className="space-y-3 text-base leading-relaxed text-foreground">
                {g.body.map((p, i) => <p key={i}>{p}</p>)}
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {g.sources.length > 0 ? (
                  <ul className="space-y-1">
                    {g.sources.map((s) => (
                      <li key={s.url}>
                        출처: <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">{s.label}</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>올블루 편집 · 일반 안내</p>
                )}
                <p className="mt-1">확인일 {g.checkedAt}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuidePage;
