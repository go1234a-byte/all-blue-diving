import { useState } from "react";
import { Link } from "react-router-dom";
import { FileCheck2, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerifiedBadge } from "@/components/tour/VerifiedBadge";
import { SettlementLedger } from "@/components/instructor/SettlementLedger";
import { InstructorNotificationCenter } from "@/components/instructor/InstructorNotificationCenter";
import { InstructorProfileEditCard } from "@/components/mypage/InstructorProfileEditCard";
import { AccountActions } from "@/components/mypage/AccountActions";
import { PushNotificationToggle } from "@/components/mypage/PushNotificationToggle";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { formatDateKR, isPastDate } from "@/lib/dates";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";

export function InstructorMyPageView() {
  const { getInstructorById, getInstructorProfileById, tours, instructorsLoading } = useAppData();
  const { currentInstructorId } = useRole();
  const instructor = getInstructorById(currentInstructorId);
  const instructorProfile = instructor ? getInstructorProfileById(instructor.profileId) : undefined;
  const [tab, setTab] = useState("recruiting");

  // 데이터가 아직 로딩 중이면 잠시 대기 — 로딩이 끝났는데도 강사 레코드를 못 찾으면
  // (예전 회원가입 버그로 profiles엔 role="instructor"인데 instructors 행이 없는
  // "유령 계정"이 된 경우) 빈 화면만 보여주고 로그아웃할 방법도 없이 갇히는 문제가
  // 있었다. 최소한 로그아웃은 항상 할 수 있도록 안내 화면을 보여준다.
  if (!instructor) {
    if (instructorsLoading) return null;
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-foreground">
          <p className="font-semibold">강사 프로필을 찾을 수 없습니다.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            계정에 문제가 있을 수 있어요. 로그아웃 후 다시 로그인해보시거나, 고객센터로
            문의해주세요.
          </p>
        </div>
        <AccountActions />
      </div>
    );
  }

  const myTours = tours.filter((t) => t.instructorId === currentInstructorId);
  const recruitingTours = myTours.filter((t) => t.status === "open" && !isPastDate(t.recruitmentDeadline));
  const completedTours = myTours.filter((t) => t.status === "closed" || isPastDate(t.endDate));

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border border-border">
              <AvatarImage src={instructor.avatarUrl} alt={instructor.name} />
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
                  <CardContent className="space-y-2 p-3">
                    <Link to={`/chat/${tour.id}`} className="flex items-center gap-3">
                      <img
                        src={tour.mainImageUrl || IMAGE_PLACEHOLDER}
                        alt={tour.title}
                        onError={handleImageFallback}
                        className="h-12 w-12 shrink-0 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-foreground">{tour.title}</p>
                        <p className="text-xs text-muted-foreground">
                          모집마감 {formatDateKR(tour.recruitmentDeadline)}
                        </p>
                      </div>
                      <Badge>모집중</Badge>
                    </Link>
                    <Button asChild size="sm" variant="outline" className="w-full gap-1 text-xs">
                      <Link to={`/instructor/tours/${tour.id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" />
                        투어 정보 수정
                      </Link>
                    </Button>
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
                  <Link to={`/chat/${tour.id}`}>
                    <CardContent className="flex items-center gap-3 p-3">
                      <img
                        src={tour.mainImageUrl || IMAGE_PLACEHOLDER}
                        alt={tour.title}
                        onError={handleImageFallback}
                        className="h-12 w-12 shrink-0 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-foreground">{tour.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDateKR(tour.endDate)} 종료</p>
                      </div>
                      <Badge variant="secondary">완료</Badge>
                    </CardContent>
                  </Link>
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

      <ThemeToggle />

      <AccountActions />
    </div>
  );
}
