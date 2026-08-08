import { NextResponse } from "next/server";
import { syncActivityListings } from "@/lib/activity/sync";

export const runtime = "nodejs";
export const maxDuration = 200;

// Vercel Cron은 GET으로 호출하고 CRON_SECRET을 Authorization 헤더에 자동으로 실어 보낸다.
// 수동 curl 테스트나 다른 스케줄러를 위해 POST도 동일하게 지원한다.
export async function GET(request: Request) {
  return handleSync(request);
}

export async function POST(request: Request) {
  return handleSync(request);
}

async function handleSync(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  try {
    const result = await syncActivityListings();
    return NextResponse.json(result);
  } catch (error) {
    console.error("activity sync failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "동기화에 실패했습니다." },
      { status: 500 }
    );
  }
}
