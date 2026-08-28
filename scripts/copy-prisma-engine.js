// Vercel 배포에서 Prisma가 "Query Engine을 찾을 수 없음" 에러를 내는 문제의 최종 우회책.
//
// 원인: Prisma 클라이언트를 node_modules가 아닌 커스텀 경로(src/generated/prisma)로
// 생성하고 있는데, Next.js의 파일 트레이싱(outputFileTracingIncludes로 명시해도)이
// 번들러(Turbopack/webpack)에 따라 제각각 다른 방식으로 실패한다 — 실제로 재현·확인함:
//   - Turbopack 빌드: 엔진 검색 경로에 "/ROOT/src/generated/prisma"라는 미치환
//     placeholder 문자열이 그대로 남아있음 (번들러가 실제 경로로 못 바꿈).
//   - webpack 빌드로 전환해도: 검색 경로가 빌드 컨테이너의 절대경로("/vercel/path0/...")로
//     고정되어 있어, 실제 런타임 경로("/var/task/...")와 달라서 여전히 실패함.
// 두 경우 모두 Prisma 런타임(@prisma/client/runtime/library.mjs)이 매번 공통으로
// ".next/server/chunks"는 검색 후보 경로에 포함시킨다는 것을 에러 로그에서 확인함 —
// 이 디렉터리는 Next.js 서버 빌드 산출물의 일부라 Vercel이 파일 트레이싱 설정과
// 무관하게 항상 통째로 포함시키므로, 여기에 엔진 바이너리를 직접 복사해두면
// 번들러가 무슨 경로를 계산하든 상관없이 항상 발견된다.
//
// next build 이후(postbuild)에 실행되어야 .next/server/chunks가 존재함.
const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "..", "src", "generated", "prisma");
const destDir = path.join(__dirname, "..", ".next", "server", "chunks");

if (!fs.existsSync(destDir)) {
  console.warn(`[copy-prisma-engine] ${destDir} 없음 — next build가 먼저 실행됐는지 확인 필요. 건너뜀.`);
  process.exit(0);
}

if (!fs.existsSync(srcDir)) {
  console.warn(`[copy-prisma-engine] ${srcDir} 없음 — prisma generate가 먼저 실행됐는지 확인 필요. 건너뜀.`);
  process.exit(0);
}

// .dll.node(윈도우용, 로컬 개발 전용)는 제외 — 프로덕션 서버리스 함수 용량만 키움(20MB+).
const engineFiles = fs
  .readdirSync(srcDir)
  .filter((f) => f.endsWith(".so.node"));

if (engineFiles.length === 0) {
  console.warn(`[copy-prisma-engine] ${srcDir}에 엔진 바이너리(.so.node/.dll.node)가 없음. 건너뜀.`);
  process.exit(0);
}

for (const file of engineFiles) {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);
  fs.copyFileSync(src, dest);
  console.log(`[copy-prisma-engine] ${file} → .next/server/chunks/ 복사 완료 (${(fs.statSync(src).size / 1024 / 1024).toFixed(1)}MB)`);
}
