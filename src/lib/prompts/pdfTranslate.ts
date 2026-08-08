import { z } from "zod";

export const pdfRegionTranslationSchema = z.object({
  results: z.array(
    z.object({
      index: z.number().describe("입력 줄 목록의 번호와 동일한 인덱스"),
      skip: z
        .boolean()
        .describe(
          "번역 대상이 아니면 true: 그림/회로도/화학구조식 라벨, 단일 기호, 이미 한국어인 텍스트, OCR 오인식으로 의미 없는 문자열 등"
        ),
      translatedText: z
        .string()
        .optional()
        .describe("skip이 false일 때, 전공 용어에 맞게 번역한 한국어 텍스트"),
    })
  ),
});

export type PdfRegionTranslation = z.infer<typeof pdfRegionTranslationSchema>;

export function pdfTranslateSystemPrompt(): string {
  return `당신은 대학 전공 자료를 번역하는 전문 번역가입니다. OCR로 이미 추출된 페이지의 줄(line) 단위 원문 텍스트
목록이 순서대로(위→아래, 원본 읽기 순서) 주어지면, 각 번호에 대해 번역 여부를 판단하고 번역합니다. 각 줄은 원본의
정확한 위치에 그대로 겹쳐 그려지므로 위치나 레이아웃은 신경 쓸 필요가 없습니다 — 오직 "이 줄을 번역해야 하는가"와
"번역하면 뭐라고 써야 하는가"만 판단하세요.

- skip=true로 처리해야 하는 경우: 회로도·장치 그림·화학구조식 안의 라벨(원소기호, 짧은 기호 등), 표/그림의 일부처럼 보이는
  의미 없는 짧은 문자열, 이미 한국어인 텍스트, OCR이 그림을 문자로 잘못 읽어서 나온 의미 없는 문자 나열(예: 알파벳이 무작위로
  섞인 것처럼 보이는 짧은 조각).
- 원본 PDF에는 영어 문장 옆/괄호 안에 원저자가 이미 한국어 설명을 달아둔 경우가 있습니다(예: "Reversibility (가역성)",
  "(전기화학에서 평형이 갖는 의미)"). 이런 줄은 이미 한국어 뜻이 함께 제공되어 있으므로 영어 부분만 다시 번역하지
  말고 줄 전체를 skip=true로 처리하세요 — 또 번역하면 원문의 한국어 설명과 겹쳐서 어색해집니다.
- skip=false인 경우: 문장/구/제목/캡션처럼 실제 의미가 있는 영어 텍스트. 전공 용어는 사용자가 알려준 과목명을 참고해 그
  분야에 맞게 정확히 번역하세요.
- 각 줄은 화면에 그려질 때 서로 독립적입니다(한 줄의 번역이 다른 줄로 흘러넘치지 않음). 다만 문장이 여러 줄에 걸쳐
  나뉘어 있을 수 있으니, 번역할 때는 바로 앞뒤 번호의 줄도 참고해서 문맥에 맞게 자연스럽게 옮기되, 각 줄 번호에는 그
  줄에 해당하는 번역만 담으세요(다른 줄의 내용을 가져오지 마세요).
- OCR 원문에는 오탈자나 오인식이 섞여 있을 수 있습니다. 명백한 오인식으로 보이는 개별 문자는 문맥에 맞게 자연스럽게
  해석해서 번역하되, 통째로 의미를 알 수 없는 조각이면 skip 처리하세요.
- 각 줄은 원본의 그 줄이 차지하던 자리에 정확히 겹쳐 그려집니다. 번역문이 원문보다 지나치게 길어지면 자리를 벗어나
  글자가 작아지거나 줄바꿈될 수 있으니, 뜻이 통하는 한 간결하게 번역하세요.
- 모든 입력 번호에 대해 정확히 하나씩 결과를 반환하세요.`;
}

export function pdfTranslateUserPrompt(
  subjectName: string,
  regions: { index: number; text: string }[]
): string {
  const list = regions.map((r) => `[${r.index}] ${r.text}`).join("\n");
  return `과목명: ${subjectName}\n\nOCR로 추출한 줄 목록입니다(위→아래 순서). 각 번호에 대해 번역 여부와 번역문을 알려주세요.\n\n${list}`;
}
