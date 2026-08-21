import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NoteTabs } from "@/components/notes/NoteTabs";
import { DeleteNoteButton } from "@/components/notes/DeleteNoteButton";
import type { SummaryContent, ExplanationContent } from "@/lib/prompts/summarize";

export default async function NoteDetailPage({
  params,
}: PageProps<"/notes/[id]">) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const file = await prisma.uploadedFile.findFirst({
    where: { id, userId: session!.user.id, purpose: "note" },
    include: { summaries: { orderBy: { createdAt: "desc" } } },
  });

  if (!file) {
    notFound();
  }

  const latestSummary = file.summaries.find((s) => s.type === "summary") ?? null;
  const latestExplanation = file.summaries.find((s) => s.type === "explanation") ?? null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{file.originalName}</h1>
          <p className="text-xs text-sb-mute">
            {new Date(file.createdAt).toLocaleString("ko-KR")}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={`/tutor/${file.id}`}
            className="text-sm font-medium text-sb-mute hover:text-sb-text"
          >
            AI선생님에게 질문하기 →
          </Link>
          <DeleteNoteButton fileId={file.id} />
        </div>
      </div>

      <div className="mt-6">
        <NoteTabs
          fileId={file.id}
          summary={
            latestSummary
              ? {
                  id: latestSummary.id,
                  title: latestSummary.title,
                  content: JSON.parse(latestSummary.contentJson) as SummaryContent,
                }
              : null
          }
          explanation={
            latestExplanation
              ? {
                  id: latestExplanation.id,
                  title: latestExplanation.title,
                  content: JSON.parse(latestExplanation.contentJson) as ExplanationContent,
                }
              : null
          }
        />
      </div>
    </div>
  );
}
