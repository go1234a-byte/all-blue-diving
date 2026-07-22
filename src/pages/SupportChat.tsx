import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaqChatPanel } from "@/components/support/FaqChatPanel";
import { SupportTicketForm } from "@/components/support/SupportTicketForm";
import { useRole } from "@/contexts/RoleContext";

const SupportChat = () => {
  const { currentDiverId } = useRole();

  return (
    <div className="flex min-h-full flex-col bg-gradient-surface">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur">
        <Link to="/mypage" className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="break-keep text-base font-semibold text-foreground">고객센터</h1>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4 md:max-w-lg">
        <Tabs defaultValue="faq">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="faq" className="text-xs">FAQ</TabsTrigger>
            <TabsTrigger value="inquiry" className="text-xs">1:1 문의</TabsTrigger>
            <TabsTrigger value="dispute" className="text-xs">분쟁조정</TabsTrigger>
            <TabsTrigger value="report" className="text-xs">신고하기</TabsTrigger>
          </TabsList>
          <TabsContent value="faq" className="pt-4">
            <FaqChatPanel />
          </TabsContent>
          <TabsContent value="inquiry" className="pt-4">
            <SupportTicketForm type="inquiry" userId={currentDiverId} />
          </TabsContent>
          <TabsContent value="dispute" className="pt-4">
            <SupportTicketForm type="dispute" userId={currentDiverId} />
          </TabsContent>
          <TabsContent value="report" className="pt-4">
            <SupportTicketForm type="report" userId={currentDiverId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SupportChat;
