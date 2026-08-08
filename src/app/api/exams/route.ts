import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  examGenerateSchema,
  examSystemPrompt,
  examUserPrompt,
} from "@/lib/prompts/examGenerate";
import { buildFileContentBlocks, type ContentBlocks } from "@/lib/claudeContent";
import { totalPointsOf } from "@/lib/exam/formatters";
import { getQuotaStatus, recordUsage, quotaExceededMessage } from "@/lib/usage";

export const runtime = "nodejs";
export const maxDuration = 120;

const createExamSchema = z.object({
  subjectId: z.string().min(1, "과목을 선택해주세요."),
  title: z.string().min(1).max(100),
  mcqCount: z.number().int().min(0).max(30),
  shortCount: z.number().int().min(0).max(30),
  essayCount: z.number().int().min(0).max(15),
  timeLimitMinutes: z.number().int().min(5).max(300),
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

  const blocks: ContentBlocks = [];
  try {
    for (const [index, file] of sourceFiles.entries()) {
      blocks.push({ type: "text", text: `[참고 자료: ${file.originalName}]` });
      // Anthropic 캐시 브레이크포인트(요청당 최대 4개)를 아끼기 위해, 기출문제가 없을 때만
      // 마지막 참고자료에 캐시 마커를 둔다 — 앞쪽 파일까지 전부 캐싱하지 않는다.
      const isLast = !pastExamFile && index === sourceFiles.length - 1;
      blocks.push(...(await buildFileContentBlocks(file, { cache: isLast })));
    }
    if (pastExamFile) {
      blocks.push({
        type: "text",
        text: `[기출문제: ${pastExamFile.originalName}] (반영 강도 ${pastExamWeight}/10)`,
      });
      blocks.push(...(await buildFileContentBlocks(pastExamFile, { cache: true })));
    }
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
      professorNotes,
      sourceFileIdsJson: JSON.stringify(sourceFileIds),
      pastExamFileId: pastExamFile?.id ?? null,
      pastExamWeight,
    },
  });

  let parsedOutput;
  try {
    const message = await anthropic.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: examSystemPrompt(),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: examUserPrompt({
                title,
                mcqCount,
                shortCount,
                essayCount,
                timeLimitMinutes,
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
    parsedOutput = message.parsed_output;
  } catch (error) {
    console.error("exam generation error", error);
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
