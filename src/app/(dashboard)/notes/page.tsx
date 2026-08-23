import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NotesPage() {
  const session = await getServerSession(authOptions);

  const files = await prisma.uploadedFile.findMany({
    where: { userId: session!.user.id, purpose: "note" },
    orderBy: { createdAt: "desc" },
    include: { summaries: { select: { id: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">노트 / 요약</h1>
        <Link
          href="/notes/new"
          className="rounded-full bg-sb-accent px-4 py-2 text-sm font-medium text-sb-accent-ink hover:-translate-y-0.5"
        >
          새 노트 업로드
        </Link>
      </div>

      {files.length === 0 ? (
        <p className="mt-8 text-sm text-sb-mute">
          아직 업로드한 노트가 없습니다. 첫 노트를 업로드해보세요.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-sb-border rounded-md border border-sb-border">
          {files.map((file) => (
            <li key={file.id}>
              <Link
                href={`/notes/${file.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-sb-hover"
              >
                <div>
                  <p className="text-sm font-medium text-sb-body">{file.originalName}</p>
                  <p className="text-xs text-sb-mute">
                    {new Date(file.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>
                <span className="text-xs text-sb-mute">{file.summaries.length}개 요약</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
