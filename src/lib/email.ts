import { supabase } from "@/integrations/supabase/client";

/**
 * 특정 유저(profileId)에게 트랜잭션 이메일을 보낸다. Resend가 아직 설정되지 않았다면
 * 서버에서 스켈레톤 응답(전송 안 함)을 반환한다 — sendPushToProfile과 동일한 패턴.
 */
export async function sendEmailToProfile(
  profileId: string,
  payload: { subject: string; body: string },
): Promise<void> {
  const { error } = await supabase.functions.invoke("send-email", {
    body: { profileId, ...payload },
  });
  if (error) {
    console.warn("[email] send-email 호출 실패(설정 전이라면 정상):", error.message);
  }
}

/**
 * 시스템에 가입되지 않은 임의 주소(변호사·보험사 등)로 트랜잭션 이메일을 보낸다.
 * 서버(send-email 함수)가 호출자가 해당 강사 본인이거나 관리자인지 다시 검증한다.
 */
export async function sendEmailToAddress(
  to: string,
  instructorId: string,
  payload: { subject: string; body: string },
): Promise<void> {
  const { error } = await supabase.functions.invoke("send-email", {
    body: { to, instructorId, ...payload },
  });
  if (error) {
    throw new Error(error.message || "이메일 발송에 실패했습니다.");
  }
}
