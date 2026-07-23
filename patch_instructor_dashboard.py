import pathlib
p = pathlib.Path("src/components/instructor/InstructorDashboard.tsx")
text = p.read_text(encoding="utf-8")

anchor1 = 'import { CalendarClock, ShieldAlert, Star, TrendingUp } from "lucide-react";'
assert anchor1 in text, "anchor1 not found"
text = text.replace(
    anchor1,
    'import { CalendarClock, Pencil, ShieldAlert, Star, TrendingUp } from "lucide-react";',
    1,
)

anchor2 = '''              {tour.status === "open" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      모집마감
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>&quot;{tour.title}&quot; 투어 모집을 지금 마감하시겠습니까?</AlertDialogTitle>
                      <AlertDialogDescription>
                        모집을 마감하면 신규 예약을 더 이상 받을 수 없습니다. 이 작업은 되돌릴 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          await closeTourRecruiting(tour.id);
                          toast({ title: `"${tour.title}" 투어 모집을 마감했습니다.` });
                        }}
                      >
                        모집마감
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}'''
assert anchor2 in text, "anchor2 not found"
replacement2 = '''              <div className="flex gap-1.5">
                <Button asChild size="sm" variant="outline" className="flex-1 gap-1 text-xs">
                  <Link to={`/instructor/tours/${tour.id}/edit`}>
                    <Pencil className="h-3.5 w-3.5" />
                    수정
                  </Link>
                </Button>
                {tour.status === "open" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="flex-1 text-xs">
                        모집마감
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>&quot;{tour.title}&quot; 투어 모집을 지금 마감하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          모집을 마감하면 신규 예약을 더 이상 받을 수 없습니다. 이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            await closeTourRecruiting(tour.id);
                            toast({ title: `"${tour.title}" 투어 모집을 마감했습니다.` });
                          }}
                        >
                          모집마감
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>'''
text = text.replace(anchor2, replacement2, 1)

p.write_text(text, encoding="utf-8")
print("OK: InstructorDashboard.tsx patched")
