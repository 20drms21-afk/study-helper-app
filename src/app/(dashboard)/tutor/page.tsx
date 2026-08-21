import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TutorUploadForm } from "@/components/tutor/TutorUploadForm";

export default async function TutorPage() {
  const session = await getServerSession(authOptions);

  const [files, subjects] = await Promise.all([
    prisma.uploadedFile.findMany({
      where: { userId: session!.user.id, purpose: "note" },
      orderBy: { createdAt: "desc" },
      include: { chatMessages: { select: { id: true } } },
    }),
    prisma.subject.findMany({
      where: { userId: session!.user.id },
      orderBy: [{ isDefault: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, color: true },
    }),
  ]);

  return (
    <div>
      <div>
        <h1 className="text-xl font-bold">AI선생님</h1>
        <p className="mt-1 text-sm text-sb-mute">
          파일을 바로 업로드해 질문하거나, 이전에 올린 노트를 선택해 이어서 질문할 수 있습니다.
        </p>
      </div>

      <div className="mt-6">
        <TutorUploadForm subjects={subjects} />
      </div>

      {files.length === 0 ? (
        <p className="mt-8 text-sm text-sb-mute">
          아직 업로드한 파일이 없습니다. 위에서 파일을 올려 바로 질문을 시작해보세요.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-white/10 rounded-md border border-white/10">
          {files.map((file) => (
            <li key={file.id}>
              <Link
                href={`/tutor/${file.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/5"
              >
                <div>
                  <p className="text-sm font-medium">{file.originalName}</p>
                  <p className="text-xs text-sb-mute">
                    {new Date(file.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>
                <span className="text-xs text-sb-mute">
                  {file.chatMessages.length > 0
                    ? `대화 ${file.chatMessages.length}건`
                    : "대화 시작하기"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
