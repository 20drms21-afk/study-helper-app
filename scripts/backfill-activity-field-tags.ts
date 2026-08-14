// 이미 major/interests는 있지만 activityFieldTags가 아직 null인 기존 프로필을 찾아
// Claude(Haiku)로 1회 분류한다. 재실행해도 안전(idempotent) — activityFieldTags가 이미
// 채워진 행은 건드리지 않는다. 카테고리 목록(src/lib/activity/fieldTags.ts)이 나중에
// 바뀌면 대상 행의 activityFieldTags를 null로 리셋한 뒤 다시 실행하면 재분류된다 — 그래서
// 1회성 스크래치 스크립트가 아니라 영구적으로 커밋해두는 유지보수 스크립트다.
//
// 실행: npx tsx scripts/backfill-activity-field-tags.ts
//
// 주의: 실제 운영 데이터(기존 사용자 프로필)를 대상으로 한다 — 이건 그 사용자들을 위한
// 정식 기능 배포이므로, 실행 후 결과를 되돌리지 않는다(테스트 계정 정리와는 별개).
//
// src/lib/anthropic.ts는 모듈 로드 시점에 곧바로 `new Anthropic({apiKey: process.env...})`를
// 실행한다 — ESM은 정적 import를 전부 먼저 끌어올려 평가하므로, 이 파일 안에서 아래
// dotenv.config()보다 먼저 `import { classifyActivityFieldTags } from ...`를 정적으로
// 적으면 dotenv가 .env를 채우기도 전에 Anthropic 클라이언트가 빈 apiKey로 생성되어 버린다
// (Next.js 런타임에서는 .env가 이미 로드된 상태로 시작하니 문제가 없지만, 이 스크립트처럼
// 순수 node/tsx로 직접 실행할 땐 순서를 직접 맞춰야 함) — 그래서 아래 두 모듈은 dotenv.config()
// 이후 동적 import()로 불러온다.
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { classifyActivityFieldTags } = await import("../src/lib/activity/classify");

  const rows = await prisma.studentProfile.findMany({
    where: {
      activityFieldTags: null,
      OR: [{ major: { not: null } }, { interests: { not: null } }],
    },
    include: { user: { select: { id: true, plan: true, email: true } } },
  });

  console.log(`대상 ${rows.length}건`);

  let success = 0;
  let failed = 0;
  for (const row of rows) {
    const source = JSON.stringify({ major: row.major ?? null, interests: row.interests ?? null });
    try {
      const categories = await classifyActivityFieldTags(
        row.user.id,
        row.user.plan,
        row.major ?? null,
        row.interests ?? null
      );
      await prisma.studentProfile.update({
        where: { id: row.id },
        data: { activityFieldTags: categories.join(","), activityFieldTagsSource: source },
      });
      console.log(
        `OK   ${row.user.email} major="${row.major ?? ""}" interests="${row.interests ?? ""}" -> [${categories.join(", ")}]`
      );
      success++;
    } catch (err) {
      console.error(`FAIL ${row.user.email}`, err);
      failed++;
    }
  }

  console.log(`완료: 성공 ${success}건 / 실패 ${failed}건 / 전체 ${rows.length}건`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
