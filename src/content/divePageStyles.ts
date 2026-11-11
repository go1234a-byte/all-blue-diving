// ALL BLUE — 다이빙 포인트 가이드 페이지(/dive, /dive/:id) 전용 스타일.
// 홈(Landing.tsx)과 같은 팔레트·여백 체계를 쓴다(네이비 + 터콰이즈, 골드는 헤어라인만).
// 화면 컴포넌트가 <style>로 넣고, 빌드 시 정적 HTML 생성 스크립트도 같은 문자열을 <head>에
// 넣어서 JS가 뜨기 전 첫 화면과 뜬 뒤 화면 모양이 같게 한다.

export const DIVE_CSS = `
.dv{--navy:#14324D;--navy-dark:#0A1B2E;--turq:#17A8BD;--turq-light:#E4F6F8;--gold:#D4AF6A;
  --text-2:rgba(20,50,77,.74);--line:rgba(20,50,77,.12);--bg-soft:#F4FAFB;--gut:clamp(16px,5vw,48px);
  color:var(--navy);background:#fff;font-family:'Plus Jakarta Sans','Pretendard',system-ui,sans-serif;
  min-height:100vh;-webkit-font-smoothing:antialiased;word-break:keep-all;}
.dv a{color:inherit;text-decoration:none;}
.dv img{display:block;max-width:100%;}
.dv-wrap{max-width:1120px;margin:0 auto;padding-inline:var(--gut);}
.dv-bar{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);padding-top:env(safe-area-inset-top);}
.dv-bar .dv-wrap{display:flex;align-items:center;justify-content:space-between;height:56px;gap:16px;}
.dv-brand{font-weight:800;letter-spacing:.02em;font-size:1.0625rem;}
.dv-brand span{font-size:.625rem;letter-spacing:.24em;opacity:.6;margin-left:6px;font-weight:600;}
.dv-back{font-size:.875rem;font-weight:600;color:var(--text-2);}
.dv-back:hover{color:var(--turq);}
.dv-eyebrow{font-size:.75rem;letter-spacing:.2em;color:var(--turq);font-weight:700;display:flex;align-items:center;gap:12px;margin:0 0 14px;}
.dv-eyebrow::before{content:"";width:28px;height:2px;background:var(--gold);}
.dv-eyebrow.light{color:#BFEFF5;}

.dv-hero{position:relative;min-height:min(62vh,560px);display:flex;align-items:flex-end;color:#fff;overflow:hidden;background:var(--navy-dark);}
.dv-hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.dv-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,27,46,.25) 0%,rgba(10,27,46,.35) 45%,rgba(10,27,46,.85) 100%);}
.dv-hero .dv-wrap{position:relative;z-index:1;padding-block:72px 40px;width:100%;}
.dv-hero h1{font-size:clamp(1.75rem,4.6vw,3rem);line-height:1.2;font-weight:800;margin:0 0 12px;letter-spacing:-.01em;}
.dv-hook{font-size:clamp(1rem,2vw,1.25rem);opacity:.92;margin:0 0 20px;max-width:640px;line-height:1.5;}
.dv-season{display:inline-flex;align-items:center;gap:8px;font-size:.8125rem;font-weight:700;border:1px solid var(--gold);border-radius:999px;padding:7px 14px;background:rgba(10,27,46,.35);}

.dv-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1px;background:#DCE4EA;border:1px solid #DCE4EA;border-radius:14px;overflow:hidden;margin:-28px 0 0;position:relative;z-index:2;box-shadow:0 24px 60px -32px rgba(10,27,46,.45);}
.dv-facts>div{background:#fff;padding:18px 20px;}
.dv-facts dt{font-size:.6875rem;letter-spacing:.14em;color:var(--turq);font-weight:700;margin-bottom:6px;}
.dv-facts dd{margin:0;font-size:.9375rem;font-weight:600;line-height:1.5;}

.dv-sec{padding-block:48px 0;}
.dv-sec h2{font-size:clamp(1.25rem,2.6vw,1.625rem);font-weight:800;margin:0 0 18px;letter-spacing:-.01em;}
.dv-lead{font-size:1.0625rem;line-height:1.75;color:var(--navy);margin:0 0 12px;font-weight:600;}
.dv-p{font-size:1rem;line-height:1.8;color:var(--text-2);margin:0;}
.dv-note{margin:20px 0 0;padding:14px 16px;border-radius:10px;background:#FFF7E8;border:1px solid #F1DDB0;color:#7A5A1E;font-size:.875rem;line-height:1.6;}

.dv-points{list-style:none;padding:0;margin:0;display:grid;gap:12px;}
.dv-points li{display:grid;grid-template-columns:36px 1fr;gap:4px 14px;padding:18px;border:1px solid var(--line);border-radius:12px;background:#fff;}
.dv-points .dv-n{grid-row:span 2;width:36px;height:36px;border-radius:50%;background:var(--turq-light);color:var(--turq);font-weight:800;display:flex;align-items:center;justify-content:center;font-size:.9375rem;}
.dv-points b{font-size:1rem;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.dv-points span.dv-d{font-size:.9375rem;color:var(--text-2);line-height:1.6;}
.dv-tag{font-size:.6875rem;font-weight:700;color:#8a6a2e;border:1px solid var(--gold);border-radius:999px;padding:3px 9px;background:#fff;}

.dv-chips{display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none;}
.dv-chips li,.dv-chips a,.dv-chips button{font-size:.875rem;font-weight:600;padding:8px 14px;border-radius:999px;background:var(--bg-soft);border:1px solid var(--line);color:var(--navy);font-family:inherit;cursor:default;}
.dv-chips a,.dv-chips button{cursor:pointer;}
.dv-chips .on{background:var(--navy);color:#fff;border-color:var(--navy);}

.dv-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;}
.dv-gallery img{width:100%;aspect-ratio:3/2;object-fit:cover;border-radius:12px;}

.dv-tours{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;}
.dv-cta{display:inline-flex;align-items:center;gap:8px;margin-top:20px;font-weight:700;font-size:.9375rem;padding:14px 24px;border-radius:8px;background:var(--turq);color:#fff !important;box-shadow:0 6px 20px -8px rgba(23,168,189,.6);}
.dv-cta:hover{filter:brightness(1.05);}
.dv-empty{padding:24px;border:1px dashed var(--line);border-radius:12px;color:var(--text-2);font-size:.9375rem;line-height:1.6;}

.dv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px;}
.dv-card{display:flex;flex-direction:column;border-radius:14px;overflow:hidden;border:1px solid var(--line);background:#fff;transition:transform .2s ease,box-shadow .2s ease;}
.dv-card:hover{transform:translateY(-2px);box-shadow:0 18px 40px -24px rgba(10,27,46,.45);}
.dv-card img{width:100%;aspect-ratio:4/3;object-fit:cover;}
.dv-card-b{padding:14px 16px 18px;display:flex;flex-direction:column;gap:6px;}
.dv-card-r{font-size:.75rem;font-weight:700;color:var(--turq);letter-spacing:.02em;}
.dv-card-h{font-size:1rem;font-weight:800;line-height:1.4;margin:0;}
.dv-card-s{font-size:.8125rem;color:var(--text-2);}
.dv-card-sp{align-self:flex-start;font-size:.6875rem;font-weight:700;color:#7A5A1E;background:#FFF7E8;border-radius:999px;padding:3px 9px;}

.dv-index-head{background:var(--navy-dark);color:#fff;padding-block:64px 44px;}
.dv-index-head h1{font-size:clamp(1.75rem,4.4vw,2.75rem);font-weight:800;margin:0 0 12px;line-height:1.25;}
.dv-index-head p{margin:0;opacity:.85;max-width:640px;line-height:1.7;}
.dv-months{position:sticky;top:56px;z-index:10;background:#fff;border-bottom:1px solid var(--line);padding-block:12px;overflow-x:auto;}
.dv-months .dv-chips{flex-wrap:nowrap;}
.dv-months .dv-chips button{white-space:nowrap;}
.dv-count{font-size:.875rem;color:var(--text-2);margin:24px 0 16px;}

.dv-disclaimer{margin:56px 0 0;padding-block:24px;border-top:1px solid var(--line);font-size:.8125rem;color:var(--text-2);line-height:1.7;}
.dv-foot-space{height:calc(88px + env(safe-area-inset-bottom));}
@media(min-width:768px){.dv-foot-space{height:48px;}}
`;
