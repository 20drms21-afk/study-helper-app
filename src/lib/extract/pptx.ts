import JSZip from "jszip";

export interface PptxImage {
  mimeType: string;
  data: Buffer;
}

export interface PptxExtractResult {
  text: string;
  images: PptxImage[];
  slideCount: number;
}

// pptx의 ppt/media/*는 벡터(emf/wmf)나 아이콘류 바이너리도 섞여 있는데, 이런 건 Claude vision이
// 못 읽는 포맷이라 래스터 이미지만 골라서 첨부한다(원본 확장자 기준 — 실제 콘텐츠 스니핑은 안 함).
const IMAGE_EXT_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

// 슬라이드 XML의 <a:t> 텍스트 런을 <a:p> 문단 단위로 모아 붙인다. 표(<a:tbl>) 안 텍스트도
// 같은 <a:t> 태그를 쓰므로 별도 처리 없이 자연스럽게 같이 뽑힌다.
function extractSlideText(xml: string): string {
  const lines: string[] = [];
  const paraRegex = /<a:p>([\s\S]*?)<\/a:p>/g;
  let paraMatch: RegExpExecArray | null;
  while ((paraMatch = paraRegex.exec(xml))) {
    const runs = [...paraMatch[1].matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) =>
      decodeXmlEntities(m[1])
    );
    const line = runs.join("").trim();
    if (line) lines.push(line);
  }
  return lines.join("\n");
}

// 파일명(slideN.xml)의 N은 슬라이드를 추가/삭제한 이력 때문에 실제 발표 순서와 어긋날 수 있다.
// 진짜 순서는 presentation.xml의 <p:sldIdLst>가 rId로 참조하고, presentation.xml.rels가
// 그 rId를 slideN.xml 경로로 매핑하는 두 파일을 같이 읽어야 나온다. 둘 중 하나라도 예상과
// 다른 형식이면(비표준 생성기 등) 파일명 숫자 정렬로 조용히 대체한다.
async function getOrderedSlidePaths(zip: JSZip): Promise<string[]> {
  const presentationXml = await zip.file("ppt/presentation.xml")?.async("string");
  const relsXml = await zip.file("ppt/_rels/presentation.xml.rels")?.async("string");

  if (presentationXml && relsXml) {
    const rIds = [...presentationXml.matchAll(/<p:sldId[^>]*r:id="(rId\d+)"/g)].map((m) => m[1]);
    const relMap = new Map(
      [...relsXml.matchAll(/<Relationship[^>]*Id="(rId\d+)"[^>]*Target="([^"]+)"/g)].map((m) => [
        m[1],
        m[2],
      ])
    );
    const paths = rIds
      .map((rId) => relMap.get(rId))
      .filter((target): target is string => Boolean(target))
      .map((target) => `ppt/${target.replace(/^\.?\//, "")}`);
    if (paths.length > 0) return paths;
  }

  return Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
      const nb = Number(b.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
      return na - nb;
    });
}

export async function extractPptx(buffer: Buffer): Promise<PptxExtractResult> {
  const zip = await JSZip.loadAsync(buffer);

  const slidePaths = await getOrderedSlidePaths(zip);
  if (slidePaths.length === 0) {
    throw new Error("PPTX에서 슬라이드를 찾지 못했습니다.");
  }

  const slideTexts: string[] = [];
  for (let i = 0; i < slidePaths.length; i++) {
    const xml = await zip.file(slidePaths[i])?.async("string");
    const text = xml ? extractSlideText(xml) : "";
    slideTexts.push(`[슬라이드 ${i + 1}]\n${text || "(텍스트 없음)"}`);
  }

  const images: PptxImage[] = [];
  const mediaPaths = Object.keys(zip.files)
    .filter((path) => path.startsWith("ppt/media/"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  for (const path of mediaPaths) {
    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    const mimeType = IMAGE_EXT_TO_MIME[ext];
    if (!mimeType) continue; // emf/wmf 등 vision이 못 읽는 포맷은 건너뜀
    const data = await zip.file(path)?.async("nodebuffer");
    if (data) images.push({ mimeType, data });
  }

  return { text: slideTexts.join("\n\n"), images, slideCount: slidePaths.length };
}
