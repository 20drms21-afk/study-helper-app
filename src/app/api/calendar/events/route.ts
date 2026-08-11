import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CALENDAR_EVENT_KINDS } from "@/lib/calendar/kind";

const createEventSchema = z.object({
  kind: z.enum(CALENDAR_EVENT_KINDS as [string, ...string[]]),
  title: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = createEventSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const { kind, title, date } = parsedBody.data;

  const event = await prisma.calendarEvent.create({
    data: { userId: session.user.id, kind, title, date },
  });

  return NextResponse.json(event, { status: 201 });
}
