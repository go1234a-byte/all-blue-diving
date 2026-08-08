import { supabase } from "@/integrations/supabase/client";

/**
 * Supabase Storage의 공개 "uploads" 버킷에 파일을 올리고 영구 공개 URL을 반환한다.
 * (이전에는 URL.createObjectURL()로 브라우저 로컬 임시 링크만 만들었는데, 이 링크는 업로드한
 * 사람의 세션에서만 유효해서 다른 사용자/기기에서는 이미지가 깨져 보이는 문제가 있었다.)
 */
export async function uploadImageFile(file: File, folder: string): Promise<string> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("uploads").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("uploads").getPublicUrl(path);
  return data.publicUrl;
}

/** 여러 파일을 병렬로 업로드하고 공개 URL 배열을 반환한다. */
export async function uploadImageFiles(files: File[], folder: string): Promise<string[]> {
  return Promise.all(files.map((f) => uploadImageFile(f, folder)));
}

/**
 * 신분증 사본/통장 사본/자격증처럼 민감한 개인 서류는 공개 "uploads" 버킷 대신 비공개
 * "instructor-documents" 버킷에 올린다. 이 버킷은 storage RLS로 "본인 소유 경로 또는
 * 관리자"만 조회할 수 있게 잠겨있다 — 그래서 여기서는 (uploadImageFile과 달리) 공개 URL을
 * 반환하지 않고, 나중에 getInstructorDocumentSignedUrl()로 서명된 임시 URL을 발급받을 때
 * 쓸 "저장 경로"만 반환한다.
 * 경로는 반드시 `${본인 auth uid}/...`로 시작해야 storage RLS를 통과한다.
 */
export async function uploadInstructorDocument(file: File, userId: string, label: string): Promise<string> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${userId}/${label}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("instructor-documents").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;
  return path;
}

/** 여러 서류 파일을 병렬로 업로드하고 저장 경로 배열을 반환한다. */
export async function uploadInstructorDocuments(files: File[], userId: string, label: string): Promise<string[]> {
  return Promise.all(files.map((f) => uploadInstructorDocument(f, userId, label)));
}

/**
 * "instructor-documents" 버킷의 저장 경로로부터 짧은 시간만 유효한 서명된 URL을 발급받는다.
 * 이 호출 자체도 storage RLS(본인 소유 경로 또는 관리자)를 통과해야 성공한다 — 즉 자격 없는
 * 사용자는 경로 문자열을 알아내도 실제 파일에 접근할 수 없다.
 */
export async function getInstructorDocumentSignedUrl(path: string, expiresInSeconds = 300): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("instructor-documents")
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) {
    console.error("[getInstructorDocumentSignedUrl] 서명된 URL 발급 실패:", error);
    return null;
  }
  return data.signedUrl;
}
