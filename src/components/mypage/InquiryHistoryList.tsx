import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateKR } from "@/lib/dates";

interface InquiryHistoryListProps {
  diverId: string;
}

export function InquiryHistoryList({ diverId }: InquiryHistoryListProps) {
  const { inquiries, getTourById } = useAppData();
  const myInquiries = inquiries.filter((i) => i.diverId === diverId);

  if (myInquiries.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">문의 내역이 없습니다.</p>
    );
  }

  return (
    <div className="space-y-2">
      {myInquiries.map((inquiry) => {
        const tour = getTourById(inquiry.tourId);
        return (
          <Card key={inquiry.id}>
            <CardContent className="space-y-1.5 p-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {inquiry.category}
                </Badge>
                <Badge variant={inquiry.status === "pending" ? "secondary" : "default"} className="text-[10px]">
                  {inquiry.status === "pending" ? "답변 대기" : "답변 완료"}
                </Badge>
              </div>
              {tour && <p className="text-xs font-medium text-foreground">{tour.title}</p>}
              <p className="line-clamp-2 text-xs text-muted-foreground">{inquiry.message}</p>
              <p className="text-[10px] text-muted-foreground">{formatDateKR(inquiry.createdAt)}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
