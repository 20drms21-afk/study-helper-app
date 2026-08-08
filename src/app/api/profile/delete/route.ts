import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteBillingKey } from "@/lib/toss";
import { deleteStoredFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const [user, files, translations] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { tossBillingKey: true } }),
    prisma.uploadedFile.findMany({
      where: { userId: session.user.id },
      select: { storedPath: true },
    }),
    prisma.pdfTranslation.findMany({
      where: { userId: session.user.id },
      select: { originalStoredPath: true, pages: { select: { translatedImagePath: true } } },
    }),
  ]);

  if (user?.tossBillingKey) {
    try {
      await deleteBillingKey(user.tossBillingKey);
    } catch (error) {
      console.error("toss billing key delete error on account deletion", error);
    }
  }

  await Promise.all(
    files.map((f) =>
      deleteStoredFile(f.storedPath).catch((error) =>
        console.error("storage file delete error on account deletion", f.storedPath, error)
      )
    )
  );

  await Promise.all(
    translations.flatMap((t) => [
      deleteStoredFile(t.originalStoredPath).catch((error) =>
        console.error("translate original file delete error on account deletion", error)
      ),
      ...t.pages.map((p) =>
        deleteStoredFile(p.translatedImagePath).catch((error) =>
          console.error("translate page file delete error on account deletion", error)
        )
      ),
    ])
  );

  await prisma.user.delete({ where: { id: session.user.id } });

  return NextResponse.json({ ok: true });
}
