import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";

/**
 * 기업/단체(워크샵·사내 행사 등) 전용 문의 게시판. router.tsx에서 로그인 가드가 걸려있어
 * 로그인한 다이버/강사(관리자 포함)만 도달하며, RLS(business_inquiries_insert_authenticated)도
 * 동일하게 강제한다.
 */
const BusinessInquiryPage = () => {
  const { addBusinessInquiry } = useAppData();
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast({ title: "기업/단체명을 입력해주세요", variant: "destructive" });
      return;
    }
    if (!contactName.trim()) {
      toast({ title: "담당자명을 입력해주세요", variant: "destructive" });
      return;
    }
    if (!phone.trim()) {
      toast({ title: "연락처를 입력해주세요", variant: "destructive" });
      return;
    }
    if (!email.trim()) {
      toast({ title: "이메일을 입력해주세요", variant: "destructive" });
      return;
    }
    if (!message.trim()) {
      toast({ title: "문의 내용을 입력해주세요", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await addBusinessInquiry({ companyName, contactName, phone, email, message });
      setSubmitted(true);
    } catch (err) {
      toast({
        title: "문의 접수에 실패했습니다",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-surface">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur">
        <Link to="/" className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="break-keep text-base font-semibold text-foreground">기업/단체 문의</h1>
      </header>

      <main className="mx-auto w-full max-w-md space-y-4 px-4 py-6 md:max-w-lg">
        {submitted ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="text-sm font-semibold text-foreground">문의가 접수되었습니다</p>
            <p className="text-xs text-muted-foreground">담당자가 확인 후 입력하신 연락처로 연락드리겠습니다.</p>
            <Button asChild variant="outline" className="mt-2">
              <Link to="/">홈으로 돌아가기</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="text-xs leading-relaxed text-muted-foreground">
              워크샵, 사내 행사 등 단체 다이빙 투어가 필요하신가요? 아래 정보를 남겨주시면
              담당자가 확인 후 연락드립니다.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="biz-company">기업/단체명</Label>
                <Input
                  id="biz-company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="예: 올블루 주식회사"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biz-contact">담당자명</Label>
                <Input
                  id="biz-contact"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="담당자 이름"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biz-phone">연락처</Label>
                <Input
                  id="biz-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biz-email">이메일</Label>
                <Input
                  id="biz-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="company@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biz-message">문의 내용</Label>
                <Textarea
                  id="biz-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="인원 규모, 희망 일정, 예산 등을 자유롭게 남겨주세요"
                  rows={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "접수 중..." : "문의 남기기"}
              </Button>
            </form>
          </>
        )}
      </main>
    </div>
  );
};

export default BusinessInquiryPage;
