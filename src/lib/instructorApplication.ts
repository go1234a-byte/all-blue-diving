export type InstructorApplicationStatus = "none" | "pending" | "rejected" | "approved";

/** 내 instructors 행으로 강사 전환 신청 상태를 판단한다. 행이 없으면 아직 신청하지 않은 것이다. */
export function instructorApplicationStatus(
  application?: { verified: boolean; rejectedAt?: string } | null,
): InstructorApplicationStatus {
  if (!application) return "none";
  if (application.verified) return "approved";
  return application.rejectedAt ? "rejected" : "pending";
}
