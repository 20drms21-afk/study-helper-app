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
import { getQuotaStatus, recordUsage, quotaExceededMessage } from "@/lib/usage";

export const runtime = "nodejs";
export const maxDuration = 120;

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
    return NextResponse.json({ error: quotaExceededMessage(quota.limit!) }, { status: 402 });
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

  let parsedOutput;
  try {
    const message = await anthropic.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: isSummary ? 8192 : 16000,
      system: isSummary ? summarySystemPrompt() : explanationSystemPrompt(),
      messages: [{ role: "user", content: contentBlocks }],
      output_config: {
        format: zodOutputFormat(isSummary ? summarySchema : explanationSchema),
      },
    });
    parsedOutput = message.parsed_output;
  } catch (error) {
    console.error("note generate error", error);
    return NextResponse.json(
      { error: "AI 생성 중 오류가 발생했습니다. API 키 설정을 확인해주세요." },
      { status: 502 }
    );
  }

  try {
    await recordUsage(session.user.id, "note_generate");
  } catch (err) {
    console.error("usage record failed", err);
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
