import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TutorChat } from "@/components/tutor/TutorChat";

export default async function TutorChatPage({
  params,
}: PageProps<"/tutor/[id]">) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const file = await prisma.uploadedFile.findFirst({
    where: { id, userId: session!.user.id, purpose: "note" },
  });

  if (!file) {
    notFound();
  }

  const messages = await prisma.chatMessage.findMany({
    where: { fileId: file.id, userId: session!.user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link href="/tutor" className="text-sm text-sb-mute hover:text-sb-text">
            ← AI선생님 목록으로
          </Link>
          <h1 className="mt-1 text-xl font-bold">{file.originalName}</h1>
        </div>
        <Link
          href={`/notes/${file.id}`}
          className="text-sm font-medium text-sb-mute hover:text-sb-text"
        >
          노트 보기 →
        </Link>
      </div>

      <TutorChat fileId={file.id} initialMessages={messages} />
    </div>
  );
}
