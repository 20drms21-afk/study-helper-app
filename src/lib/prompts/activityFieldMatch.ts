import { z } from "zod";
import { ACTIVITY_FIELD_TAG_CATEGORIES } from "@/lib/activity/fieldTags";

export const activityFieldMatchSchema = z.object({
  categories: z
    .array(z.enum(ACTIVITY_FIELD_TAG_CATEGORIES))
    .describe("학생과 실제로 관련 있는 카테고리만. 확신이 없으면 빈 배열."),
});

export type ActivityFieldMatchContent = z.infer<typeof activityFieldMatchSchema>;

export function activityFieldMatchSystemPrompt(): string {
  return `당신은 대학생의 전공/관심분야 텍스트를 보고, 대외활동·공모전 매칭에 쓰일 고정된
분야 카테고리 중 이 학생과 진짜 관련 있는 것만 골라내는 분류기입니다.

[카테고리 목록 — 이 안에서만 선택. 목록에 없는 값은 절대 만들어내지 마세요]
${ACTIVITY_FIELD_TAG_CATEGORIES.map((c) => `- ${c}`).join("\n")}

[핵심 원칙 — 정직한 0건이 억지 매칭보다 낫다]
학생이 실제로 흥미를 가질 만한 대외활동/공모전이 존재하는 분야만 고르세요. 조금이라도
확신이 없으면 카테고리를 넣지 마세요 — 빈 배열(categories: [])을 반환하는 것이 잘못된
카테고리를 붙이는 것보다 훨씬 낫습니다. 예를 들어 "소방공학과"나 "천문학과"처럼 목록의
어떤 카테고리와도 명확히 들어맞지 않는 전공이면, 억지로 "과학/공학/기술/IT"에 끼워
맞추지 말고 빈 배열을 반환하세요 — 해당 학생에게 실제로 관련된 공모전이 거의 없다면
그게 정직한 결과입니다. 전공명에 단순히 "공학"이라는 글자가 들어있다고 해서 자동으로
과학/공학/기술/IT를 고르지 마세요 — 실제로 그 분야의 대외활동/공모전이 있을지 판단하세요.

[판단 기준]
- 전공명에 명시적으로 포함된 학문 분야(예: "컴퓨터공학과" → 과학/공학/기술/IT)는 신뢰도
  높게 매칭하세요.
- 표면적인 단어 유사성만으로 판단하지 말고, 그 전공/관심사를 가진 학생이 실제로 지원할
  법한 대외활동·공모전이 있는 분야인지 판단하세요.
- 관심분야(interests)는 전공보다 더 직접적인 흥미 표현이니 그대로 반영하세요.
- 여러 카테고리에 걸쳐 있으면(예: "화공생명공학과" → 과학/공학/기술/IT, 의료/보건 둘 다
  가능) 명확히 관련 있는 카테고리를 모두 반환하세요 — 상한 개수는 없습니다.
- 전공/관심분야가 모두 비어 있으면 반드시 빈 배열을 반환하세요.`;
}

export function activityFieldMatchUserPrompt(major: string | null, interests: string | null): string {
  return `전공: ${major ?? "미입력"}
관심분야: ${interests ?? "미입력"}`;
}
