import { NextResponse } from "next/server";
import { syncScholarshipListings } from "@/lib/scholarship/kosaf";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  try {
    const result = await syncScholarshipListings();
    return NextResponse.json(result);
  } catch (error) {
    console.error("scholarship sync failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "동기화에 실패했습니다." },
      { status: 500 }
    );
  }
}
