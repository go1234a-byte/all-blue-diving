import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaqChatPanel } from "@/components/support/FaqChatPanel";
import { SupportTicketForm } from "@/components/support/SupportTicketForm";
import { MyInquiriesList } from "@/components/support/MyInquiriesList";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";

type InquiryView = "write" | "history";
type SupportTab = "faq" | "inquiry" | "dispute" | "report";

const SupportChat = () => {
  const { profile, authLoading } = useRole();
  // 1:1문의/분쟁조정/신고는 다이버뿐 아니라 강사도 접수할 수 있어야 하므로, 역할별로
  // 값이 갈리는 currentDiverId 대신 로그인한 계정의 공통 profiles.id를 사용한다.
  // (이전에는 currentDiverId를 그대로 넘겨써서 강사 계정은 빈 문자열이 전달됐고,
  // 그 결과 접수가 DB에 저장되지 않는 채로 성공 토스트만 뜨는 문제가 있었다.)
  const userId = profile?.id ?? "";
  const [inquiryView, setInquiryView] = useState<InquiryView>("write");
  // FAQ 탭의 "문의 남기기" 버튼을 눌렀을 때 실제로 접수되는 1:1 문의 탭으로 이동시키기 위해
  // 탭 상태를 여기서 직접 관리한다(기존에는 FAQ 탭 안에서 가짜 실시간 채팅 UI로만 전환되고
  // 실제로는 어디에도 접수되지 않는 문제가 있었다).
  const [activeTab, setActiveTab] = useState<SupportTab>("faq");

  return (
    <div className="flex min-h-full flex-col bg-gradient-surface">
      <header
        className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(3.5rem + env(safe-area-inset-top))" }}
      >
        <Link to="/mypage" className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="break-keep text-base font-semibold text-foreground">고객센터</h1>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4 md:max-w-3xl md:px-6">
        {/* 로그인 직후 session -> profiles 조회가 끝나기 전까지는 userId가 아직
            빈 문자열이라, authLoading을 안 보면 "내 문의 보기" 등에서 실제로는 문의 내역이
            있는데도 잠깐 비어보인다. MyPage와 동일하게 인증 확인 중에는 로딩 상태만 보여준다. */}
        {authLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
            인증 정보를 확인하는 중...
          </div>
        ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SupportTab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="faq" className="text-xs">FAQ</TabsTrigger>
            <TabsTrigger value="inquiry" className="text-xs">1:1 문의</TabsTrigger>
            <TabsTrigger value="dispute" className="text-xs">분쟁조정</TabsTrigger>
            <TabsTrigger value="report" className="text-xs">신고하기</TabsTrigger>
          </TabsList>
          <TabsContent value="faq" className="pt-4">
            <FaqChatPanel
              onRequestInquiry={() => {
                setActiveTab("inquiry");
                setInquiryView("write");
              }}
            />
          </TabsContent>
          <TabsContent value="inquiry" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-secondary/50 p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => setInquiryView("write")}
                className={cn(
                  "rounded-md py-1.5 transition-colors",
                  inquiryView === "write" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                문의하기
              </button>
              <button
                type="button"
                onClick={() => setInquiryView("history")}
                className={cn(
                  "rounded-md py-1.5 transition-colors",
                  inquiryView === "history" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                내 문의 보기
              </button>
            </div>
            {inquiryView === "write" ? (
              <SupportTicketForm type="inquiry" userId={userId} />
            ) : (
              <MyInquiriesList userId={userId} />
            )}
          </TabsContent>
          <TabsContent value="dispute" className="pt-4">
            <SupportTicketForm type="dispute" userId={userId} />
          </TabsContent>
          <TabsContent value="report" className="pt-4">
            <SupportTicketForm type="report" userId={userId} />
          </TabsContent>
        </Tabs>
        )}
      </main>
    </div>
  );
};

export default SupportChat;
