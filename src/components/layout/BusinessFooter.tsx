import { Link } from "react-router-dom";
import { BUSINESS_INFO } from "@/lib/businessInfo";

/** 상품 탐색부터 결제까지 어느 화면에서든 판매자를 확인할 수 있게 하는 사업자 정보(전자상거래법·카드사 심사). */
export function BusinessFooter() {
  return (
    <footer className="mx-auto mt-8 w-full max-w-3xl space-y-1 border-t border-border px-4 py-5 text-[11px] leading-relaxed text-muted-foreground">
      <p>{BUSINESS_INFO.companyName} | 대표: {BUSINESS_INFO.ceoName} | 사업자등록번호: {BUSINESS_INFO.businessNumber}</p>
      <p>통신판매업신고번호: {BUSINESS_INFO.mailOrderNumber}</p>
      <p>주소: {BUSINESS_INFO.address}</p>
      <p>고객센터: {BUSINESS_INFO.email} | {BUSINESS_INFO.phone}</p>
      <p className="flex gap-3 pt-1">
        <Link to="/terms" className="underline underline-offset-2">이용약관</Link>
        <Link to="/privacy" className="underline underline-offset-2">개인정보처리방침</Link>
        <Link to="/refund-policy" className="underline underline-offset-2">환불정책</Link>
      </p>
    </footer>
  );
}
