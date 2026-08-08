import { PDFiumLibrary } from "@hyzyla/pdfium";
import sharp from "sharp";

export interface RenderedPage {
  pageNumber: number; // 1-based
  buffer: Buffer;
  width: number;
  height: number;
}

// PDFium은 WASM 모듈이라 문서마다 라이브러리 인스턴스를 초기화/파괴해야 한다(안 그러면 메모리 누수).
// 여러 페이지를 한 번에 렌더링할 때는 라이브러리/문서를 한 번만 열고 재사용한다.
export async function renderPdfPages(
  pdfBuffer: Buffer,
  pageNumbers: number[],
  scale = 2
): Promise<RenderedPage[]> {
  const library = await PDFiumLibrary.init();
  try {
    const document = await library.loadDocument(new Uint8Array(pdfBuffer));
    try {
      const results: RenderedPage[] = [];
      for (const pageNumber of pageNumbers) {
        const page = document.getPage(pageNumber - 1);
        const rendered = await page.render({ scale, render: "bitmap" });
        const png = await sharp(rendered.data, {
          raw: { width: rendered.width, height: rendered.height, channels: 4 },
        })
          .png()
          .toBuffer();
        results.push({ pageNumber, buffer: png, width: rendered.width, height: rendered.height });
      }
      return results;
    } finally {
      document.destroy();
    }
  } finally {
    library.destroy();
  }
}

export async function renderPdfPage(
  pdfBuffer: Buffer,
  pageNumber: number,
  scale = 2
): Promise<RenderedPage> {
  const [page] = await renderPdfPages(pdfBuffer, [pageNumber], scale);
  return page;
}
