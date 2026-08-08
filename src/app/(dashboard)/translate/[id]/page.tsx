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
        <p className="mt-1 text-sm text-gray-600">
          {translation.subjectName} · {translation.translatedPageCount}/{translation.pageCount}페이지
        </p>
      </div>

      {translation.status === "processing" && (
        <p className="rounded-md border border-gray-200 p-4 text-sm text-gray-600">
          아직 변환 중입니다. 잠시 후 새로고침해주세요.
        </p>
      )}
      {translation.status === "failed" && (
        <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
