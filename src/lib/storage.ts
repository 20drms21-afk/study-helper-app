import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads";

function client() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function saveUploadedFile(
  userId: string,
  originalName: string,
  buffer: Buffer,
  mimeType?: string
): Promise<{ storedPath: string }> {
  // Supabase Storage 키는 한글 등 비-ASCII 문자와 콜론 같은 특수문자를 거부함(400 Invalid key)
  // — ASCII 영문/숫자/./-/_ 만 남기고 나머지는 전부 치환. 원본 파일명(originalName)은 DB에 그대로 저장되어
  // 화면에는 영향 없음, 저장 경로(storedPath)만 안전한 문자로 바뀜.
  const safeName = originalName.replace(/[^a-zA-Z0-9_.-]+/g, "_");
  const storedPath = `${userId}/${randomUUID()}-${safeName}`;

  const { error } = await client()
    .storage.from(BUCKET)
    .upload(storedPath, buffer, {
      contentType: mimeType,
      upsert: false,
    });
  if (error) throw error;

  return { storedPath };
}

export async function readStoredFile(storedPath: string): Promise<Buffer> {
  const { data, error } = await client().storage.from(BUCKET).download(storedPath);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

export async function deleteStoredFile(storedPath: string): Promise<void> {
  await client().storage.from(BUCKET).remove([storedPath]);
}
