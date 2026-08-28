import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { buildFileContentBlocks } from "@/lib/claudeContent";
import {
  NOTE_CONTENT_TYPES,
  summarySchema,
  summarySystemPrompt,
  explanationSchema,
  explanationSystemPrompt,
} from "@/lib/prompts/summarize";
import { getQuotaStatus, quotaExceededMessage } from "@/lib/usage";
import { recordAiUsage, AiUsageFeature, AiUsageStatus, newOperationId, summarizeAiError } from "@/lib/ai/aiUsage";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  type: z.enum(NOTE_CONTENT_TYPES),
});

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/notes/[id]/generate">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const quota = await getQuotaStatus(session.user.id);
  if (!quota.allowed) {
    return NextResponse.json({ error: quotaExceededMessage(quota.limit!, quota.plan) }, { status: 402 });
  }

  const { id } = await ctx.params;
  const file = await prisma.uploadedFile.findFirst({
    where: { id, userId: session.user.id, purpose: "note" },
  });

  if (!file) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "type 값이 올바르지 않습니다." }, { status: 400 });
  }
  const { type } = parsedBody.data;

  let contentBlocks;
  try {
    contentBlocks = await buildFileContentBlocks(file, { cache: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "파일 처리 중 오류가 발생했습니다." },
      { status: 400 }
    );
  }

  const isSummary = type === "summary";
  const feature = isSummary ? AiUsageFeature.NOTE_SUMMARY : AiUsageFeature.NOTE_EXPLANATION;
  const operationId = newOperationId("note");

  // "AI 설명"(explanation) 생성이 원문 분량이 많은 파일에서 문장 중간에 뚝 끊기는 문제가
  // 실사용 중 재현됨 — exams/route.ts에서 이미 겪은 것과 동일한 원인: max_tokens가 부족해서
  // 구조화 출력(JSON) 생성이 중간에 잘리는 것(explanation은 "여러 문단의 서술형 글"을 요구해서
  // summary보다 훨씬 길어짐). exams 쪽 해법을 그대로 따름 — max_tokens를 넉넉히 올리고
  // (다 안 쓰면 그만큼 과금되지 않으므로 상한을 크게 잡아도 비용 부담 없음), Anthropic SDK가
  // "10분 넘게 걸릴 수 있는 요청은 스트리밍 필수"라며 비스트리밍 호출(.parse)을 막는 지점을
  // 넘지 않도록 스트리밍(.stream + finalMessage)으로 전환함 — 최종 결과(usage/parsed_output)는
  // .parse()와 동일하게 받아짐.
  let parsedOutput;
  try {
    const genStream = anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: isSummary ? 8192 : 64000,
      system: [
        {
          type: "text",
          text: isSummary ? summarySystemPrompt() : explanationSystemPrompt(),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: contentBlocks }],
      output_config: {
        format: zodOutputFormat(isSummary ? summarySchema : explanationSchema),
      },
    });
    const message = await genStream.finalMessage();
    await recordAiUsage({
      userId: session.user.id,
      plan: quota.plan,
      feature,
      operationId,
      usage: message.usage,
      metadata: { fileType: file.fileKind, generationType: type },
    });
    parsedOutput = message.parsed_output;
  } catch (error) {
    console.error("note generate error", error);
    await recordAiUsage({
      userId: session.user.id,
      plan: quota.plan,
      feature,
      operationId,
      status: AiUsageStatus.FAILED,
      metadata: { fileType: file.fileKind, generationType: type, ...summarizeAiError(error) },
    });
    return NextResponse.json(
      { error: "AI 생성 중 오류가 발생했습니다. API 키 설정을 확인해주세요." },
      { status: 502 }
    );
  }

  if (!parsedOutput) {
    return NextResponse.json(
      { error: "생성에 실패했습니다. 다시 시도해주세요." },
      { status: 502 }
    );
  }

  const summary = await prisma.summaryNote.create({
    data: {
      userId: session.user.id,
      sourceFileId: file.id,
      title: parsedOutput.title,
      type,
      contentJson: JSON.stringify(parsedOutput),
    },
  });

  return NextResponse.json(summary, { status: 201 });
}
