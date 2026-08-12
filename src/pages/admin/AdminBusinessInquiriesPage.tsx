import { BusinessInquiryQueue } from "@/components/admin/BusinessInquiryQueue";

const AdminBusinessInquiriesPage = () => (
  <div className="space-y-5">
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">기업/단체 문의</h3>
      <p className="text-xs text-muted-foreground">
        홈 화면 "기업/단체 문의" 게시판으로 접수된 워크샵·사내 행사 등 단체 투어 문의입니다.
        로그인한 다이버/강사만 남길 수 있습니다.
      </p>
    </div>
    <BusinessInquiryQueue />
  </div>
);

export default AdminBusinessInquiriesPage;
