// DeepL Document Translation API 클라이언트. 이전(Claude vision+OCR 하이브리드)과 근본적으로
// 다른 접근이다 — 페이지 이미지를 raster화해서 그 위에 번역문을 겹쳐 그리는 대신, PDF의 실제
// 텍스트 레이어를 DeepL이 직접 읽어 문서 자체를 재구성해서 돌려준다. "번역 상자가 원문 위치를
// 못 맞춘다"는 문제 자체가 애초에 없다(좌표를 추측하지 않으므로). 다만 이 방식은 텍스트 레이어가
// 있는 PDF(PPT/문서를 그대로 내보낸 것)에서만 잘 동작하고, 스캔 이미지로만 이루어진 PDF는 DeepL이
// 처리하지 못할 수 있다 — 이 프로젝트의 주 사용처(강의자료 PPT→PDF 변환본)에는 잘 맞는 전제.
const DEEPL_API_URL = process.env.DEEPL_API_URL || "https://api-free.deepl.com/v2";

function apiKey(): string {
  const key = process.env.DEEPL_API_KEY;
  if (!key) throw new Error("DEEPL_API_KEY가 설정되지 않았습니다.");
  return key;
}

interface UploadResult {
  documentId: string;
  documentKey: string;
}

async function uploadDocument(
  fileBuffer: Buffer,
  filename: string,
  targetLang: string,
  sourceLang: string
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(fileBuffer)]), filename);
  formData.append("target_lang", targetLang);
  formData.append("source_lang", sourceLang);

  const res = await fetch(`${DEEPL_API_URL}/document`, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${apiKey()}` },
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`DeepL 업로드 실패: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const data = await res.json();
  return { documentId: data.document_id, documentKey: data.document_key };
}

type DeepLStatus = "queued" | "translating" | "done" | "error";

async function checkStatus(documentId: string, documentKey: string): Promise<{ status: DeepLStatus; message?: string }> {
  const res = await fetch(`${DEEPL_API_URL}/document/${documentId}`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ document_key: documentKey }),
  });
  if (!res.ok) {
    throw new Error(`DeepL 상태 조회 실패: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const data = await res.json();
  return { status: data.status, message: data.error_message };
}

const POLL_INTERVAL_MS = 3000;
// DeepL 처리 시간은 문서 크기에 따라 몇 초~몇 분까지 걸릴 수 있다. maxDuration(route.ts에서 280초로
// 설정)을 넘기지 않도록, 폴링 자체에도 상한을 둬서 무한정 기다리지 않게 한다.
const MAX_POLL_MS = 240_000;

async function waitForCompletion(documentId: string, documentKey: string): Promise<void> {
  const deadline = Date.now() + MAX_POLL_MS;
  while (Date.now() < deadline) {
    const { status, message } = await checkStatus(documentId, documentKey);
    if (status === "done") return;
    if (status === "error") throw new Error(`DeepL 번역 실패: ${message ?? "알 수 없는 오류"}`);
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error("DeepL 번역이 시간 내에 끝나지 않았습니다.");
}

async function downloadResult(documentId: string, documentKey: string): Promise<Buffer> {
  const res = await fetch(`${DEEPL_API_URL}/document/${documentId}/result`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ document_key: documentKey }),
  });
  if (!res.ok) {
    throw new Error(`DeepL 다운로드 실패: ${res.status} ${await res.text().catch(() => "")}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// PDF 파일 하나를 통째로 DeepL에 보내 번역된 PDF를 받아온다. 업로드 → 폴링 → 다운로드 3단계를
// 순서대로 거치는 동기 호출 하나로 감싼다(호출자 입장에서는 이 함수 하나만 await하면 됨).
export async function translatePdfWithDeepL(
  pdfBuffer: Buffer,
  filename: string,
  targetLang = "KO",
  sourceLang = "EN"
): Promise<Buffer> {
  const { documentId, documentKey } = await uploadDocument(pdfBuffer, filename, targetLang, sourceLang);
  await waitForCompletion(documentId, documentKey);
  return downloadResult(documentId, documentKey);
}
