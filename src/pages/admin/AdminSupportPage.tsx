import { useSearchParams } from "react-router-dom";
import { SupportTicketQueue } from "@/components/admin/SupportTicketQueue";
import type { SupportTicketStatus, SupportTicketType } from "@/types";

const URGENT_TYPES: SupportTicketType[] = ["dispute", "report"];
const PENDING_STATUSES: SupportTicketStatus[] = ["접수", "검토중"];

/** 대시보드 "문의 대기" 패널의 답변 대기/긴급 문의 항목에서 각각
 * ?status=pending / ?type=urgent 로 넘어와 여기서 목록을 그 기준대로 좁혀 보여준다. */
const AdminSupportPage = () => {
  const [searchParams] = useSearchParams();
  const types = searchParams.get("type") === "urgent" ? URGENT_TYPES : undefined;
  const statuses = searchParams.get("status") === "pending" ? PENDING_STATUSES : undefined;

  return <SupportTicketQueue types={types} statuses={statuses} />;
};

export default AdminSupportPage;
