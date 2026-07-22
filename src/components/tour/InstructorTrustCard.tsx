import { ChevronRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/tour/VerifiedBadge";
import { InstructorMiniScoreboard } from "@/components/tour/InstructorMiniScoreboard";
import { useAppData } from "@/contexts/AppDataContext";
import type { InstructorProfile } from "@/types";

interface InstructorTrustCardProps {
  instructor: InstructorProfile;
}

export function InstructorTrustCard({ instructor }: InstructorTrustCardProps) {
  const { getReviewsByInstructorId } = useAppData();
  const instructorReviews = getReviewsByInstructorId(instructor.id);
  const avgRating =
    instructorReviews.length > 0
      ? instructorReviews.reduce((sum, r) => sum + r.rating, 0) / instructorReviews.length
      : 0;

  return (
    <Card className="border-primary/20 bg-gradient-surface">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            담당 강사 신뢰 인증
          </h4>
          {instructor.verified && <VerifiedBadge size="md" />}
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14 border border-border">
            <AvatarImage src={instructor.avatarUrl} alt={instructor.name} crossOrigin="anonymous" />
            <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground">
              {instructor.name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-semibold text-foreground">{instructor.name} 강사</p>
              {instructor.agency && (
                <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                  {instructor.agency}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{instructor.bio}</p>
            {instructorReviews.length > 0 && (
              <p className="flex items-center gap-1 pt-0.5 text-xs font-medium text-foreground">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                {avgRating.toFixed(1)} · 후기 {instructorReviews.length}개
              </p>
            )}
          </div>
        </div>

        <InstructorMiniScoreboard instructor={instructor} />

        <Link
          to={`/instructor/${instructor.id}/profile`}
          className="flex items-center justify-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          강사 프로필 더보기
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
