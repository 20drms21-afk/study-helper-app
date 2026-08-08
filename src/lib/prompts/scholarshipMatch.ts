import { z } from "zod";

export const scholarshipMatchSchema = z.object({
  results: z.array(
    z.object({
      listingId: z.string(),
      eligible: z.boolean().describe("학생 프로필 기준으로 신청 자격이 있다고 판단되면 true"),
      reason: z.string().describe("판단 근거를 한국어로 간단히"),
    })
  ),
});

export type ScholarshipMatchContent = z.infer<typeof scholarshipMatchSchema>;

export interface ScholarshipProfileInput {
  region: string | null;
  major: string | null;
  gradeLevel: number | null;
  incomeBracket: number | null;
  gpa: number | null;
}

export interface ScholarshipListingInput {
  listingId: string;
  provider: string;
  name: string;
  eligibilityText: string;
}

export function scholarshipMatchSystemPrompt(): string {
  return `당신은 대학생에게 장학금 자격을 안내하는 상담원입니다.
학생의 프로필(거주 지역/전공/학년/소득분위/직전 학기 성적)과 각 장학금의 신청 자격 원문을 비교해, 이 학생이 신청 가능한지 판단하세요.

- 자격 요건 원문에 지역/소득분위/학과/성적(평점) 등 조건이 명시되어 있으면 학생 프로필과 정확히 대조하세요. 성적 기준은 4.5 만점 기준으로 비교하세요.
- 원문에 명시되지 않은 조건은 임의로 추측해 배제하지 마세요 (조건이 없으면 그 기준은 통과한 것으로 간주).
- 학생 프로필의 특정 항목이 비어있으면(null) 해당 기준은 판단할 수 없으니 보수적으로 eligible: false로 처리하고 reason에 "프로필에 OO 정보가 없어 판단 불가"라고 남기세요.
- 모든 장학금에 대해 빠짐없이 결과를 반환하세요 (listingId 기준).`;
}

export function scholarshipMatchUserPrompt(
  profile: ScholarshipProfileInput,
  listings: ScholarshipListingInput[]
): string {
  const profileText = `[학생 프로필]
거주 지역: ${profile.region ?? "미입력"}
전공: ${profile.major ?? "미입력"}
학년: ${profile.gradeLevel ?? "미입력"}
소득분위: ${profile.incomeBracket ?? "미입력"}
직전 학기 성적(4.5 만점): ${profile.gpa ?? "미입력"}`;

  const listingsText = listings
    .map(
      (l, i) => `[장학금 ${i + 1}] (listingId: ${l.listingId})
운영기관: ${l.provider}
상품명: ${l.name}
신청 자격 원문: ${l.eligibilityText}`
    )
    .join("\n\n");

  return `${profileText}\n\n${listingsText}`;
}
