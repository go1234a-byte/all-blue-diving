import { useState } from "react";
import { FileCheck2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerifiedBadge } from "@/components/tour/VerifiedBadge";
import { SettlementLedger } from "@/components/instructor/SettlementLedger";
import { InstructorNotificationCenter } from "@/components/instructor/InstructorNotificationCenter";
import { InstructorProfileEditCard } from "@/components/mypage/InstructorProfileEditCard";
import { AccountActions } from "@/components/mypage/AccountActions";
import { PushNotificationToggle } from "@/components/mypage/PushNotificationToggle";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { formatDateKR, isPastDate } from "@/lib/dates";

export function InstructorMyPageView() {
  const { getInstructorById, getInstructorProfileById, tours } = useAppData();
  const { currentInstructorId } = useRole();
  const instructor = getInstructorById(currentInstructorId);
  const instructorProfile = instructor ? getInstructorProfileById(instructor.profileId) : undefined;
  const [tab, setTab] = useState("recruiting");

  if (!instructor) return null;

  const myTours = tours.filter((t) => t.instructorId === currentInstructorId);
  const recruitingTours = myTours.filter((t) => t.status === "open" && !isPastDate(t.recruitmentDeadline));
  const completedTours = myTours.filter((t) => t.status === "closed" || isPastDate(t.endDate));

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border border-border">
              <AvatarImage src={instructor.avatarUrl} alt={instructor.name} crossOrigin="anonymous" />
              <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                {instructor.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-sm font-semibold text-foreground">{instructor.name} 강사</p>
                {instructor.agency && (
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                    {instructor.agency}
                  </Badge>
                )}
              </div>
              {instructor.verified ? (
                <VerifiedBadge className="mt-1" />
              ) : (
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  인증 심사 대기중
                </Badge>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {instructor.licenseFileNames.map((file) => (
              <div
                key={file}
                className="flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5 text-xs text-secondary-foreground"
              >
                <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-success" />
                <span className="truncate">{file}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <InstructorProfileEditCard instructor={instructor} profile={instructorProfile} />

      <InstructorNotificationCenter instructorId={currentInstructorId} />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">내가 개설한 투어 관리</h3>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recruiting">모집중 ({recruitingTours.length})</TabsTrigger>
            <TabsTrigger value="completed">완료 ({completedTours.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="recruiting" className="space-y-2 pt-3">
            {recruitingTours.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">모집중인 투어가 없습니다.</p>
            ) : (
              recruitingTours.map((tour) => (
                <Card key={tour.id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <img
                      src={tour.mainImageUrl}
                      alt={tour.title}
                      crossOrigin="anonymous"
                      className="h-12 w-12 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-foreground">{tour.title}</p>
                      <p className="text-xs text-muted-foreground">
                        모집마감 {formatDateKR(tour.recruitmentDeadline)}
                      </p>
                    </div>
                    <Badge>모집중</Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          <TabsContent value="completed" className="space-y-2 pt-3">
            {completedTours.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">완료된 투어가 없습니다.</p>
            ) : (
              completedTours.map((tour) => (
                <Card key={tour.id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <img
                      src={tour.mainImageUrl}
                      alt={tour.title}
                      crossOrigin="anonymous"
                      className="h-12 w-12 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-foreground">{tour.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDateKR(tour.endDate)} 종료</p>
                    </div>
                    <Badge variant="secondary">완료</Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">정산 원장</h3>
        <SettlementLedger instructorId={currentInstructorId} />
      </div>

      <PushNotificationToggle />

      <AccountActions />
    </div>
  );
}
