import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUS_LABEL: Record<string, string> = {
  processing: "변환 중",
  done: "완료",
  failed: "실패",
};

export default async function TranslatePage() {
  const session = await getServerSession(authOptions);

  const translations = await prisma.pdfTranslation.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">PDF 영어자료 변환</h1>
          <p className="mt-1 text-sm text-sb-mute">
            영어로 된 전공 PDF를 업로드하면 레이아웃은 그대로 두고 한글 번역본을 만들어드려요.
          </p>
        </div>
        <Link
          href="/translate/new"
          className="rounded-full bg-sb-accent px-4 py-2 text-sm font-medium text-sb-accent-ink hover:-translate-y-0.5"
        >
          새로 변환하기
        </Link>
      </div>

      {translations.length === 0 ? (
        <p className="mt-8 text-sm text-sb-mute">아직 변환한 자료가 없습니다.</p>
      ) : (
        <ul className="mt-6 divide-y divide-white/10 rounded-md border border-white/10">
          {translations.map((t) => (
            <li key={t.id}>
              <Link
                href={`/translate/${t.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/5"
              >
                <div>
                  <p className="text-sm font-medium">{t.originalFileName}</p>
                  <p className="text-xs text-sb-mute">
                    {t.subjectName} · {t.translatedPageCount}/{t.pageCount}페이지 ·{" "}
                    {new Date(t.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>
                <span className="text-xs text-sb-mute">{STATUS_LABEL[t.status] ?? t.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
