import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, FileCheck2, FileText, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerifiedBadge } from "@/components/tour/VerifiedBadge";
import { SettlementLedger } from "@/components/instructor/SettlementLedger";
import { InstructorNotificationCenter } from "@/components/instructor/InstructorNotificationCenter";
import { InstructorProfileEditCard } from "@/components/mypage/InstructorProfileEditCard";
import { InstructorBusinessTypeBanner } from "@/components/mypage/InstructorBusinessTypeBanner";
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
  // recruitmentDeadline은 상세페이지에 표시만 되는 안내용 날짜일 뿐, 실제 예약 가능 여부는
  // status로만 결정된다(TourDetail 예약 버튼도 deadline을 보지 않는다). 자동마감은 출발일
  // 30일 전(recruitmentDeadline과 무관한 별개 기준)에만 status를 "closed"로 바꾸므로, 예전엔
  // 이 필터가 deadline이 지났지만 아직 자동마감은 안 된 투어를 모집중 탭에서 빼버렸고, 그
  // 투어는 마감/완료/취소 어느 탭에도 안 걸려 통째로 안 보였다.
  const recruitingTours = myTours.filter((t) => t.status === "open");
  // 예전엔 마감(모집만 종료)과 취소(강사 자진취소/최소인원미달/관리자 강제정지)가 전부
  // status: "closed"로 동일하게 저장돼서 한 "완료" 탭에 뒤섞여 있었다. cancelledAt이
  // 채워진 투어만 "취소"로 분리하고, 나머지는 종료일이 지났는지로 마감/완료를 나눈다.
  const cancelledTours = myTours.filter((t) => t.cancelledAt);
  const closedTours = myTours.filter(
    (t) => !t.cancelledAt && t.status === "closed" && !isPastDate(t.endDate),
  );
  const completedTours = myTours.filter((t) => !t.cancelledAt && isPastDate(t.endDate));

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

      <InstructorBusinessTypeBanner instructor={instructor} />

      <InstructorProfileEditCard instructor={instructor} profile={instructorProfile} />

      {/* 관리자가 서류 보완 요청·반려 사유 등을 남기는 비공개 안내 메모함 — 관리자와 본인만
          볼 수 있다. 이의신청용 "비밀 중재방"(/instructor/arbitration)과는 별개의 채널이다. */}
      <Link
        to="/instructor/notes"
        className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
      >
        <span className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          관리자 안내
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <InstructorNotificationCenter instructorId={currentInstructorId} />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">내가 개설한 투어 관리</h3>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="recruiting">모집중 ({recruitingTours.length})</TabsTrigger>
            <TabsTrigger value="closed">마감 ({closedTours.length})</TabsTrigger>
            <TabsTrigger value="completed">완료 ({completedTours.length})</TabsTrigger>
            <TabsTrigger value="cancelled">취소 ({cancelledTours.length})</TabsTrigger>
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
          <TabsContent value="closed" className="space-y-2 pt-3">
            {closedTours.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">마감된 투어가 없습니다.</p>
            ) : (
              closedTours.map((tour) => (
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
                        <p className="text-xs text-muted-foreground">
                          출발 {formatDateKR(tour.startDate)} 예정 · 모집마감
                        </p>
                      </div>
                      <Badge variant="secondary">마감</Badge>
                    </CardContent>
                  </Link>
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
          <TabsContent value="cancelled" className="space-y-2 pt-3">
            {cancelledTours.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">취소된 투어가 없습니다.</p>
            ) : (
              cancelledTours.map((tour) => (
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
                        <p className="text-xs text-muted-foreground">
                          {formatDateKR(tour.cancelledAt!)} 취소
                        </p>
                      </div>
                      <Badge variant="destructive">취소</Badge>
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
