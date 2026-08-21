import { NextResponse } from "next/server";
import { z } from "zod";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { buildFileContentBlocks } from "@/lib/claudeContent";
import { chatSystemPrompt } from "@/lib/prompts/chat";
import { getQuotaStatus, quotaExceededMessage } from "@/lib/usage";
import { recordAiUsage, AiUsageFeature, AiUsageStatus, newOperationId, summarizeAiError } from "@/lib/ai/aiUsage";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  message: z.string().trim().min(1, "질문을 입력해주세요.").max(2000),
});

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/tutor/[id]/chat">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const file = await prisma.uploadedFile.findFirst({
    where: { id, userId: session.user.id, purpose: "note" },
  });
  if (!file) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { fileId: id, userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/tutor/[id]/chat">
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
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 }
    );
  }
  const { message } = parsedBody.data;

  const history = await prisma.chatMessage.findMany({
    where: { fileId: id, userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  let fileBlocks;
  try {
    fileBlocks = await buildFileContentBlocks(file, { cache: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "파일 처리 중 오류가 발생했습니다." },
      { status: 400 }
    );
  }

  const anthropicMessages: MessageParam[] = [];

  if (history.length === 0) {
    anthropicMessages.push({
      role: "user",
      content: [...fileBlocks, { type: "text", text: message }],
    });
  } else {
    const [firstMessage, ...rest] = history;
    anthropicMessages.push({
      role: "user",
      content: [...fileBlocks, { type: "text", text: firstMessage.content }],
    });
    for (const m of rest) {
      anthropicMessages.push({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      });
    }
    anthropicMessages.push({ role: "user", content: message });
  }

  const operationId = newOperationId("tutor");
  const chatMetadata = { conversationTurn: history.length + 1, attachedFileCount: 1 };

  let answer: string;
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: chatSystemPrompt(),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: anthropicMessages,
    });
    await recordAiUsage({
      userId: session.user.id,
      plan: quota.plan,
      feature: AiUsageFeature.TUTOR_CHAT,
      operationId,
      usage: response.usage,
      metadata: chatMetadata,
    });
    answer = response.content
      .filter((block): block is { type: "text"; text: string } & typeof block => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
  } catch (error) {
    console.error("chat error", error);
    await recordAiUsage({
      userId: session.user.id,
      plan: quota.plan,
      feature: AiUsageFeature.TUTOR_CHAT,
      operationId,
      status: AiUsageStatus.FAILED,
      metadata: { ...chatMetadata, ...summarizeAiError(error) },
    });
    return NextResponse.json(
      { error: "AI 응답 생성 중 오류가 발생했습니다. API 키 설정을 확인해주세요." },
      { status: 502 }
    );
  }

  if (!answer) {
    return NextResponse.json(
      { error: "응답 생성에 실패했습니다. 다시 시도해주세요." },
      { status: 502 }
    );
  }

  await prisma.chatMessage.create({
    data: { userId: session.user.id, fileId: id, role: "user", content: message },
  });
  const assistantMessage = await prisma.chatMessage.create({
    data: { userId: session.user.id, fileId: id, role: "assistant", content: answer },
  });

  return NextResponse.json(assistantMessage, { status: 201 });
}
