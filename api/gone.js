// 도메인 이전 주인(대만 워드프레스 블로그)의 옛 주소. SPA 폴백이 200을 돌려주면
// 구글이 옛 글을 계속 색인에 남기므로 410(영구 삭제)으로 답한다.
export default function handler(req, res) {
  res.setHeader("X-Robots-Tag", "noindex");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.status(410).send("Gone");
}
