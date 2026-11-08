import { Link } from "react-router-dom";
import { DIVE_BASICS } from "@/content/diveBasics";
import { handleImageFallback } from "@/lib/image";

/** 홈 "처음이라면 읽어 보세요" — 기초·안전 글 가로줄. 카드 → /guide#글id */
export function DiveBasicsRow() {
  return (
    <section className="ab-basics" aria-labelledby="ab-basics-h">
      <style>{CSS}</style>
      <div className="wrap ab-basics-head">
        <div>
          <h2 id="ab-basics-h">처음이라면 읽어 보세요</h2>
          <p>자격증부터 비행 전 쉬는 시간까지, 떠나기 전에 알아 둘 것들.</p>
        </div>
        <Link to="/guide" className="ab-basics-all">전체 가이드 →</Link>
      </div>
      <div className="ab-basics-row">
        {DIVE_BASICS.map((g) => (
          <Link key={g.id} to={`/guide#${g.id}`} className="ab-basic">
            <img src={g.image} alt="" onError={handleImageFallback} loading="lazy" />
            <h3>{g.title}</h3>
            <p>{g.summary}</p>
            <span>{g.sources.length ? `출처 ${g.sources[0].label.split(" —")[0]}` : "올블루 편집"}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const CSS = `
.ab-basics{padding-block:clamp(64px,9vw,120px);background:var(--bg);word-break:keep-all;}
.ab-basics-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:28px;}
.ab-lp .ab-basics h2{font-size:clamp(1.75rem,1.1rem + 2.4vw,2.75rem);letter-spacing:-.025em;}
.ab-basics-head p{margin-top:10px;color:var(--text-2);}
.ab-basics-all{font-weight:700;color:var(--navy);white-space:nowrap;}
.ab-basics-all:hover{text-decoration:underline;}
.ab-basics-row{display:flex;gap:24px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;
  --pad:max(var(--gut),calc((100vw - var(--maxw))/2 + var(--gut)));padding:0 var(--pad) 8px;scroll-padding-inline:var(--pad);}
.ab-basics-row::-webkit-scrollbar{display:none;}
.ab-basic{flex:0 0 280px;scroll-snap-align:start;color:inherit;text-decoration:none;}
.ab-basic img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:16px;margin-bottom:14px;transition:transform .3s;}
.ab-basic:hover img{transform:scale(1.02);}
.ab-basic h3{font-size:1.1875rem;line-height:1.35;color:var(--navy);}
.ab-basic p{margin-top:6px;color:var(--text-2);}
.ab-basic span{display:block;margin-top:8px;font-size:.875rem;font-weight:600;color:#0E7385;}
.ab-basic:focus-visible{outline:2px solid var(--turq);outline-offset:4px;border-radius:16px;}
@media(max-width:640px){.ab-basic{flex-basis:72vw;}.ab-basics-row{gap:16px;}.ab-basics-head{flex-direction:column;align-items:flex-start;}}
@media (prefers-reduced-motion:reduce){.ab-basic img{transition:none;}}
`;
