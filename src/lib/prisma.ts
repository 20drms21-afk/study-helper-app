import path from "node:path";
import fs from "node:fs";
import { PrismaClient } from "@/generated/prisma/client";

// Vercel 배포에서 Prisma가 "Query Engine을 찾을 수 없음" 에러를 내는 문제의 근본 해결책.
//
// 원인: Prisma 클라이언트를 커스텀 경로(src/generated/prisma)로 생성하면
// (isCustomOutput: true), Prisma 런타임(@prisma/client/runtime/library.js)이
// 엔진 바이너리를 찾을 때 쓰는 5개의 내장 후보 경로가 전부 어긋난다 — 실제
// Vercel 런타임 로그를 열어 소스코드(resolveEnginePath)까지 직접 대조해서 확인함:
//   1. r.dirname                              → 번들러가 계산한 값(웹팩: ".next/server/chunks",
//                                                Turbopack: 미치환 "/ROOT/..." placeholder — 둘 다 틀림)
//   2. resolve(런타임 라이브러리의 __dirname, "..") → "/vercel/path0/src/generated" (← "prisma" 폴더가
//                                                빠진 오답이자, 애초에 빌드 컨테이너 경로라 런타임엔 없음)
//   3. generator.output.value (빌드 시점에 구운 절대경로) → "/vercel/path0/src/generated/prisma"
//                                                (빌드 컨테이너 경로라 런타임 "/var/task/..."엔 존재 안 함)
//   4. resolve(__dirname, "../../../.prisma/client")      → 기본 출력 위치 (커스텀 output이라 해당 없음)
//   5. "/tmp/prisma-engines"                    → 런타임 다운로드용 폴백 (오프라인 환경이라 실패)
// 다섯 후보 전부 실제 파일 위치("/var/task/src/generated/prisma/...")와 어긋난다.
// (.next/server/chunks에 파일을 직접 복사해두는 시도도 해봤지만, Vercel의 Next.js
// 빌더가 각 라우트의 파일 트레이싱 결과(.nft.json)에 없는 파일은 배포 산출물에서
// 제외한다는 것까지 확인함 — 빌드 로그엔 복사 성공이 찍히는데 배포된 함수 크기는
// 그대로였음.)
//
// Vercel의 Node.js 서버리스 함수는 항상 프로젝트 루트가 process.cwd()가 되도록
// 보장하므로(공식 문서에 명시됨), 이 휴리스틱들을 아예 우회하고 PRISMA_QUERY_ENGINE_LIBRARY
// 환경변수로 정확한 경로를 직접 지정한다 — 이 변수가 설정되어 있으면 Prisma는
// 후보 탐색 없이 그 값을 그대로 사용한다. 로컬 Windows 개발 환경에는 해당 파일이
// 없으므로(다른 이름의 .dll.node 엔진을 씀) 파일 존재를 확인한 뒤에만 설정해서
// 로컬 동작에 영향 없게 함.
// process.platform 체크가 반드시 필요함 — 로컬 macOS/Linux 개발 환경이나, 이 프로젝트처럼
// binaryTargets에 "native"(로컬 OS용)와 "rhel-openssl-3.0.x"를 둘 다 지정해두면 로컬에도
// 이 .so.node 파일이 같이 생성되므로, platform 체크 없이 파일 존재만으로 분기하면 리눅스가
// 아닌 로컬 환경에서도 이 값이 잘못 설정돼 버림(ELF 바이너리를 다른 OS에서 dlopen 시도 → 크래시).
if (!process.env.PRISMA_QUERY_ENGINE_LIBRARY && process.platform === "linux") {
  const linuxEnginePath = path.join(
    process.cwd(),
    "src",
    "generated",
    "prisma",
    "libquery_engine-rhel-openssl-3.0.x.so.node",
  );
  if (fs.existsSync(linuxEnginePath)) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = linuxEnginePath;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
