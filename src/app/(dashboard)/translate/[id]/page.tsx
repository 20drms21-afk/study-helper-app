import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TranslationViewer } from "@/components/translate/TranslationViewer";

export default async function TranslateDetailPage({
  params,
}: PageProps<"/translate/[id]">) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const translation = await prisma.pdfTranslation.findFirst({
    where: { id, userId: session!.user.id },
  });

  if (!translation) {
    notFound();
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold">{translation.originalFileName}</h1>
        <p className="mt-1 text-sm text-sb-mute">
          {translation.subjectName} · {translation.translatedPageCount}/{translation.pageCount}페이지
        </p>
      </div>

      {translation.status === "processing" && (
        <p className="rounded-md border border-sb-border p-4 text-sm text-sb-mute">
          아직 변환 중입니다. 잠시 후 새로고침해주세요.
        </p>
      )}
      {translation.status === "failed" && (
        <p className="rounded-md border border-[rgba(255,138,138,0.3)] bg-[rgba(255,138,138,0.1)] p-4 text-sm text-[#ff8a8a]">
          변환에 실패했습니다: {translation.errorMessage ?? "알 수 없는 오류"}
        </p>
      )}
      {translation.status === "done" && (
        <TranslationViewer
          translationId={translation.id}
          pageCount={translation.pageCount}
          translatedPageCount={translation.translatedPageCount}
        />
      )}
    </div>
  );
}
