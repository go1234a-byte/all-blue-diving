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
