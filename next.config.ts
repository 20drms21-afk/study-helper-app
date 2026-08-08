import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // tesseract.js는 워커 스크립트 경로를 런타임에 직접 require()로 찾는 방식이라, Turbopack/webpack이
  // 번들링하면서 그 경로를 잘못 재작성해 "Cannot find module ...worker-script/node/index.js" 에러가
  // 남(실측 확인 — /translate 업로드가 7분 넘게 걸리다 결국 이 에러로 실패했음). 번들링 대상에서
  // 제외하고 node_modules에서 그대로 require하게 하면 해결된다.
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;
