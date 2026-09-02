import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma 클라이언트 출력 경로를 node_modules가 아닌 src/generated/prisma로 커스텀했더니,
  // Next.js의 자동 파일 트레이싱(어떤 파일을 서버리스 함수 번들에 넣을지 결정하는 정적 분석)이
  // 쿼리 엔진 바이너리(.so.node 등, 런타임에 동적으로 require되어 정적 분석으로 못 잡음)를
  // 못 찾아서 빌드는 성공해도 실제 배포된 함수엔 rhel-openssl-3.0.x 엔진이 빠지는 문제가 있었음
  // (배포 후 로그인 등 Prisma 쿼리가 걸리는 모든 요청이 "Query Engine을 찾을 수 없음"으로 실패,
  // 실제 재현·확인함). 엔진 바이너리를 명시적으로 포함시켜서 해결.
  outputFileTracingIncludes: {
    "/**/*": ["./src/generated/prisma/**/*"],
  },
  // @hyzyla/pdfium(PDF 영어자료 변환의 페이지 래스터화에 씀, src/lib/translate/render.ts)이
  // 프로덕션 빌드(webpack, 844dd84에서 Turbopack→webpack 전환)에서만 "TypeError: a is not
  // a function" (Vercel 런타임 로그로 실제 재현·확인, 원본/번역본 페이지 이미지 요청이 전부
  // 500) 으로 깨지는 문제가 있었음. 이 패키지는 Emscripten이 생성한 대형 WASM 로더 글루
  // 코드를 그대로 내장하고 있는데(ESM/CJS 양쪽 조건부 export, Node 환경 감지 등), webpack이
  // 이걸 번들링/미니파이하는 과정에서 vendor(=WASM 인스턴스화 팩토리 함수) export가 깨짐 —
  // sharp가 겪는 것과 같은 종류의 문제이고, sharp는 Next.js 기본 serverExternalPackages
  // 목록에 이미 포함돼 있어 안 겪는다(node_modules/next/dist/lib/server-external-packages.jsonc
  // 확인함). 같은 방식으로 번들링 대상에서 제외해서 Node의 기본 require/import가 그대로
  // 처리하게 하면 해결됨 — Prisma 엔진 바이너리 문제와 근본 원인이 같은 계열(번들러가 런타임
  // 동적 로딩 로직을 정적 분석하려다 깨는 것)이라 같은 해법(번들링 자체를 우회)을 적용함.
  serverExternalPackages: ["@hyzyla/pdfium"],
};

export default nextConfig;
