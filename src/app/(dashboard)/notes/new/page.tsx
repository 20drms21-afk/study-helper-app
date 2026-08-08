import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UploadForm } from "@/components/notes/UploadForm";

export default async function NewNotePage() {
  const session = await getServerSession(authOptions);

  const subjects = await prisma.subject.findMany({
    where: { userId: session!.user.id },
    orderBy: [{ isDefault: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, color: true },
  });

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-bold">새 노트 업로드</h1>
      <p className="mt-1 text-sm text-gray-600">
        PDF, DOCX 문서 또는 필기 사진을 업로드하면 요약, 강의식 설명, 질문하기 기능을 사용할 수 있습니다.
      </p>
      <div className="mt-6">
        <UploadForm subjects={subjects} />
      </div>
    </div>
  );
}
