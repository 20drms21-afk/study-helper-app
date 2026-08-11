import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic, CLAUDE_MODEL, CLAUDE_BLUEPRINT_MODEL } from "@/lib/anthropic";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  examGenerateSchema,
  examSystemPrompt,
  examUserPrompt,
  examBlueprintSchema,
  examBlueprintSystemPrompt,
  examBlueprintUserPrompt,
  buildFallbackBlueprint,
  blueprintMatchesCounts,
  EXAM_DIFFICULTY_MIN,
  EXAM_DIFFICULTY_MAX,
  EXAM_DIFFICULTY_DEFAULT,
  type ExamBlueprintItem,
} from "@/lib/prompts/examGenerate";
import { buildFileContentBlocks, type ContentBlocks } from "@/lib/claudeContent";
import { totalPointsOf } from "@/lib/exam/formatters";
import { getQuotaStatus, recordUsage, quotaExceededMessage } from "@/lib/usage";
import { recordAiUsage, AiUsageFeature, AiUsageStatus, summarizeAiError } from "@/lib/ai/aiUsage";

export const runtime = "nodejs";
// Blueprint 설계 + 실제 문제 생성, Claude 호출 2번. 실측으로 5.4분(324초)짜리 생성이
// 나온 적 있어서(문제 수 많음+고난도 조합) 180초로는 배포 환경(Vercel)에서 함수가
// 중간에 강제 종료될 수 있었다 — 여유를 두고 300초로 올림(플랜에 따라 Vercel이 이보다
// 낮게 다시 캡할 수 있음 — 그 경우 Vercel 대시보드에서 실제 상한을 확인할 것).
export const maxDuration = 300;

const createExamSchema = z.object({
  subjectId: z.string().min(1, "과목을 선택해주세요."),
  title: z.string().min(1).max(100),
  mcqCount: z.number().int().min(0).max(30),
  shortCount: z.number().int().min(0).max(30),
  essayCount: z.number().int().min(0).max(15),
  timeLimitMinutes: z.number().int().min(5).max(300),
  difficulty: z.number().int().min(EXAM_DIFFICULTY_MIN).max(EXAM_DIFFICULTY_MAX).default(EXAM_DIFFICULTY_DEFAULT),
  professorNotes: z.string().max(2000).optional(),
  sourceFileIds: z.array(z.string()).min(1, "참고자료 파일을 하나 이상 업로드해주세요."),
  pastExamFileId: z.string().optional(),
  pastExamWeight: z.number().int().min(0).max(10).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const papers = await prisma.examPaper.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      config: { select: { timeLimitMinutes: true } },
      attempts: { select: { id: true, submittedAt: true }, orderBy: { startedAt: "desc" } },
    },
  });

  return NextResponse.json(papers);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const quota = await getQuotaStatus(session.user.id);
  if (!quota.allowed) {
    return NextResponse.json({ error: quotaExceededMessage(quota.limit!) }, { status: 402 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = createExamSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const {
    subjectId,
    title,
    mcqCount,
    shortCount,
    essayCount,
    timeLimitMinutes,
    difficulty,
    professorNotes,
    sourceFileIds,
    pastExamFileId,
  } = parsedBody.data;

  if (mcqCount + shortCount + essayCount === 0) {
    return NextResponse.json(
      { error: "문제를 최소 1개 이상 구성해주세요." },
      { status: 400 }
    );
  }

  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, userId: session.user.id },
  });
  if (!subject) {
    return NextResponse.json({ error: "과목을 찾을 수 없습니다." }, { status: 400 });
  }

  const sourceFiles = await prisma.uploadedFile.findMany({
    where: { id: { in: sourceFileIds }, userId: session.user.id },
  });

  if (sourceFiles.length === 0) {
    return NextResponse.json(
      { error: "참고자료 파일을 찾을 수 없습니다." },
      { status: 400 }
    );
  }

  let pastExamFile = null;
  if (pastExamFileId) {
    pastExamFile = await prisma.uploadedFile.findFirst({
      where: { id: pastExamFileId, userId: session.user.id },
    });
    if (!pastExamFile) {
      return NextResponse.json(
        { error: "기출문제 파일을 찾을 수 없습니다." },
        { status: 400 }
      );
    }
  }
  const pastExamWeight = pastExamFile ? (parsedBody.data.pastExamWeight ?? 5) : null;

  // 기출문제 블록은 블루프린트 단계(1단계)와 실제 문제 생성 단계(2단계) 둘 다에서 쓴다 —
  // 별도로 떼어둬서 두 번 읽지 않게 한다. 참고자료 전체는 2단계에서만 붙인다(블루프린트는
  // "문제별 시간을 어떻게 배분할지"만 정하면 되므로 전체 자료까지 필요하지 않음 — 그만큼
  // 가볍고 빠르게 끝남).
  const pastExamBlocks: ContentBlocks = [];
  const blocks: ContentBlocks = [];
  try {
    if (pastExamFile) {
      pastExamBlocks.push({
        type: "text",
        text: `[기출문제: ${pastExamFile.originalName}] (반영 강도 ${pastExamWeight}/10)`,
      });
      pastExamBlocks.push(...(await buildFileContentBlocks(pastExamFile, { cache: true })));
    }

    for (const [index, file] of sourceFiles.entries()) {
      blocks.push({ type: "text", text: `[참고 자료: ${file.originalName}]` });
      // Anthropic 캐시 브레이크포인트(요청당 최대 4개)를 아끼기 위해, 기출문제가 없을 때만
      // 마지막 참고자료에 캐시 마커를 둔다 — 앞쪽 파일까지 전부 캐싱하지 않는다.
      const isLast = !pastExamFile && index === sourceFiles.length - 1;
      blocks.push(...(await buildFileContentBlocks(file, { cache: isLast })));
    }
    blocks.push(...pastExamBlocks);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "파일 처리 중 오류가 발생했습니다." },
      { status: 400 }
    );
  }

  const config = await prisma.examConfig.create({
    data: {
      userId: session.user.id,
      subjectId,
      title,
      mcqCount,
      shortCount,
      essayCount,
      timeLimitMinutes,
      difficulty,
      professorNotes,
      sourceFileIdsJson: JSON.stringify(sourceFileIds),
      pastExamFileId: pastExamFile?.id ?? null,
      pastExamWeight,
    },
  });

  // 예상문제 생성 1회 = Claude 호출 2건(Blueprint + 실제 생성). 두 AiUsageEvent를
  // 같은 operationId로 묶어서 나중에 "예상문제 생성 1건 총 비용"을 합산할 수 있게 한다.
  // ExamConfig는 두 Claude 호출 전에 이미 만들어져 있으니 그 id를 그대로 쓴다.
  const operationId = `exam_${config.id}`;
  const examMetadata = {
    sourceFileCount: sourceFiles.length,
    pastExamFileCount: pastExamFile ? 1 : 0,
    questionCount: mcqCount + shortCount + essayCount,
    examMinutes: timeLimitMinutes,
    difficulty,
    pastExamWeight: pastExamWeight ?? 0,
  };

  // 1단계: Exam Blueprint — 문제별 예상 풀이시간(=분량/깊이 배분)만 먼저 설계한다.
  // 여기서 정하는 건 "얼마나 어려운가"가 아니라 "얼마나 오래 걸리게 낼 것인가"이고,
  // 뒤이은 2단계에서 난이도는 사용자가 지정한 값 그대로 고정한 채 이 배분을 따른다.
  // AI 호출이 실패하거나 요청한 문제 유형별 개수와 다르게 나오면, 문제 없이 결정론적
  // 폴백(유형별 가중치 배분)으로 넘어간다 — 블루프린트 실패가 시험 생성 전체를 막지 않음.
  let blueprint: ExamBlueprintItem[];
  try {
    const blueprintMessage = await anthropic.messages.parse({
      model: CLAUDE_BLUEPRINT_MODEL,
      max_tokens: 4096, // 문제 최대치(mcq 30 + short 30 + essay 15 = 75개)에서도 항목별 JSON이 다 들어가게 여유를 둠
      system: [
        {
          type: "text",
          text: examBlueprintSystemPrompt(),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: examBlueprintUserPrompt({
                mcqCount,
                shortCount,
                essayCount,
                timeLimitMinutes,
                difficulty,
                professorNotes,
                pastExamWeight,
              }),
            },
            ...pastExamBlocks,
          ],
        },
      ],
      output_config: { format: zodOutputFormat(examBlueprintSchema) },
    });
    await recordAiUsage({
      userId: session.user.id,
      plan: quota.plan,
      feature: AiUsageFeature.EXAM_BLUEPRINT,
      operationId,
      model: CLAUDE_BLUEPRINT_MODEL,
      usage: blueprintMessage.usage,
      metadata: examMetadata,
    });
    const parsedBlueprint = blueprintMessage.parsed_output?.items ?? [];
    blueprint = blueprintMatchesCounts(parsedBlueprint, mcqCount, shortCount, essayCount)
      ? parsedBlueprint
      : buildFallbackBlueprint(mcqCount, shortCount, essayCount, timeLimitMinutes);
  } catch (error) {
    console.error("exam blueprint generation failed, falling back to deterministic split", error);
    // 블루프린트 실패는 결정론적 폴백으로 넘어가 시험 생성 자체는 계속 진행되지만,
    // Claude 호출 자체는 실패했으므로 원가 로그에는 FAILED로 남긴다.
    await recordAiUsage({
      userId: session.user.id,
      plan: quota.plan,
      feature: AiUsageFeature.EXAM_BLUEPRINT,
      operationId,
      model: CLAUDE_BLUEPRINT_MODEL,
      status: AiUsageStatus.FAILED,
      metadata: { ...examMetadata, ...summarizeAiError(error) },
    });
    blueprint = buildFallbackBlueprint(mcqCount, shortCount, essayCount, timeLimitMinutes);
  }

  // 2단계: Blueprint를 기준으로 실제 문제를 생성한다. 난이도는 사용자가 지정한 값 그대로,
  // 문제별 분량/깊이는 Blueprint의 예상 풀이시간을 따르도록 프롬프트에서 명확히 분리해둠.
  //
  // effort:"high"의 확장 사고(thinking)가 max_tokens를 그대로 잡아먹는 경우가 있다
  // (난이도가 높거나 문제 수가 많을수록 사고량이 커짐). 처음엔 32000으로 올렸는데 그것도
  // 부족한 실제 사례(문제 수 많음+고난도 조합, 5.4분짜리 요청)가 나와서 JSON이 문장 중간에
  // 잘리는 파싱 실패가 재현됐다 — claude-sonnet-5가 스트리밍 시 실제로 지원하는 최대치인
  // 128000까지 올려서 이 종류의 truncation을 원천적으로 막는다(다 안 쓰면 그만큼 과금되지
  // 않으므로 상한을 넉넉히 잡아도 비용 부담은 없음).
  // max_tokens가 커지면 Anthropic SDK가 "10분 넘게 걸릴 수 있는 요청은 스트리밍 필수"라며
  // 비스트리밍 호출(.parse)을 막아버리므로(non-streaming 상한 ≈ maxTokens*60*60000/128000
  // > 10분), 스트리밍(.stream + finalMessage)으로 바꿔서 그 제한 자체를 피한다 — 최종
  // 결과(usage/parsed_output)는 .parse()와 동일하게 받아짐.
  let parsedOutput;
  try {
    const genStream = anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 128000,
      system: [
        {
          type: "text",
          text: examSystemPrompt(),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: examUserPrompt({
                title,
                difficulty,
                blueprint,
                professorNotes,
                pastExamWeight,
              }),
            },
            ...blocks,
          ],
        },
      ],
      output_config: { effort: "high", format: zodOutputFormat(examGenerateSchema) },
    });
    const message = await genStream.finalMessage();
    await recordAiUsage({
      userId: session.user.id,
      plan: quota.plan,
      feature: AiUsageFeature.EXAM_GENERATE,
      operationId,
      usage: message.usage,
      metadata: examMetadata,
    });
    parsedOutput = message.parsed_output;
  } catch (error) {
    console.error("exam generation error", error);
    await recordAiUsage({
      userId: session.user.id,
      plan: quota.plan,
      feature: AiUsageFeature.EXAM_GENERATE,
      operationId,
      status: AiUsageStatus.FAILED,
      metadata: { ...examMetadata, ...summarizeAiError(error) },
    });
    await prisma.examConfig.delete({ where: { id: config.id } });
    return NextResponse.json(
      { error: "AI 시험 생성 중 오류가 발생했습니다. API 키 설정을 확인해주세요." },
      { status: 502 }
    );
  }

  try {
    await recordUsage(session.user.id, "exam_generate");
  } catch (err) {
    console.error("usage record failed", err);
  }

  if (!parsedOutput || parsedOutput.questions.length === 0) {
    await prisma.examConfig.delete({ where: { id: config.id } });
    return NextResponse.json(
      { error: "시험 생성에 실패했습니다. 다시 시도해주세요." },
      { status: 502 }
    );
  }

  const examPaper = await prisma.examPaper.create({
    data: {
      configId: config.id,
      userId: session.user.id,
      title: parsedOutput.title,
      totalPoints: totalPointsOf(parsedOutput.questions),
      questions: {
        create: parsedOutput.questions.map((q) => ({
          order: q.order,
          type: q.type,
          prompt: q.prompt,
          choicesJson: q.choices ? JSON.stringify(q.choices) : null,
          correctAnswer: q.correctAnswer,
          modelAnswer: q.modelAnswer,
          points: q.points,
          topicTag: q.topicTag,
          explanation: q.explanation,
        })),
      },
    },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(examPaper, { status: 201 });
}
