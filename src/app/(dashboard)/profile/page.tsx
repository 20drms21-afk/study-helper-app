import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StudentProfileForm } from "@/components/profile/StudentProfileForm";
import { MaterialsLibrary } from "@/components/profile/MaterialsLibrary";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [studentProfile, subjects, files] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId } }),
    prisma.subject.findMany({
      where: { userId },
      orderBy: [{ isDefault: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, color: true },
    }),
    prisma.uploadedFile.findMany({
      where: { userId, purpose: "note" },
      orderBy: { createdAt: "desc" },
      select: { id: true, originalName: true, subjectId: true, sizeBytes: true, createdAt: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-xl font-bold">마이페이지</h1>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-900">관심분야/전공 설정</h2>
        <StudentProfileForm
          initialValue={{
            region: studentProfile?.region ?? null,
            major: studentProfile?.major ?? null,
            gradeLevel: studentProfile?.gradeLevel ?? null,
            incomeBracket: studentProfile?.incomeBracket ?? null,
            gpa: studentProfile?.gpa ?? null,
            interests: studentProfile?.interests ?? null,
          }}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-900">자료 보관함</h2>
        <p className="mb-3 text-xs text-gray-500">
          과목별로 자료를 업로드해두면 노트/요약, 예상문제출력, AI선생님에서 다시 업로드하지
          않고 바로 선택해서 쓸 수 있어요.
        </p>
        <MaterialsLibrary
          initialSubjects={subjects}
          initialFiles={files.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() }))}
        />
      </section>
    </div>
  );
}
