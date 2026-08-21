import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ExamConfigForm } from "@/components/exam/ExamConfigForm";

export default async function NewExamPage() {
  const session = await getServerSession(authOptions);

  const [subjects, libraryFiles] = await Promise.all([
    prisma.subject.findMany({
      where: { userId: session!.user.id },
      orderBy: [{ isDefault: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, color: true },
    }),
    prisma.uploadedFile.findMany({
      where: { userId: session!.user.id, purpose: "note" },
      orderBy: { createdAt: "desc" },
      select: { id: true, originalName: true, subjectId: true, createdAt: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold">새 예상시험문제 만들기</h1>
      <p className="mt-1 text-sm text-sb-mute">
        참고자료 파일과 시험 구성을 입력하면 AI가 예상 문제를 생성합니다. 마이페이지 자료
        보관함에 올려둔 파일을 바로 선택하거나, 여기서 새로 업로드할 수 있습니다.
      </p>

      <div className="mt-6">
        <ExamConfigForm
          subjects={subjects}
          libraryFiles={libraryFiles.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() }))}
        />
      </div>
    </div>
  );
}
