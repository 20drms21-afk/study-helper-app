// fontkit엔 공식 타입 선언이 없어서(@types/fontkit도 없음) 우리가 실제로 쓰는
// 부분(폰트 열기 + 텍스트 레이아웃의 advanceWidth)만 최소한으로 선언함.
// src/lib/pdf/summaryLayout.ts의 PDF 2단 레이아웃 줄바꿈 폭 계산에 사용.
declare module "fontkit" {
  interface GlyphRun {
    advanceWidth: number;
  }

  interface Font {
    unitsPerEm: number;
    layout(text: string): GlyphRun;
  }

  // fontkit의 node-target ESM 빌드(dist/module.mjs)는 default export가 없고
  // named export(openSync/open 등)만 있음 — default import를 쓰면 Turbopack이
  // "Export default doesn't exist in target module"로 빌드를 깨뜨림.
  export function openSync(path: string): Font;
  export type { Font, GlyphRun };
}
