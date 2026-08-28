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
};

export default nextConfig;
