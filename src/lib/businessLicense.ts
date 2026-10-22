import type { InstructorProfile } from "@/types";

/** 개인·법인사업자로 신고하고 사업자등록증까지 낸 강사인지. 아니면 신규 투어 등록이 막힌다(DB 트리거도 같은 기준). */
export function hasBusinessLicense(instructor: Pick<InstructorProfile, "businessType" | "businessLicensePath"> | undefined): boolean {
  return Boolean(instructor?.businessLicensePath && instructor.businessType && instructor.businessType !== "freelancer");
}
