import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TimerSetup } from "@/components/timer/TimerSetup";

export default async function TimerPage() {
  const session = await getServerSession(authOptions);

  const subjects = await prisma.subject.findMany({
    where: { userId: session!.user.id },
    orderBy: [{ isDefault: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, color: true },
  });

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-xl font-bold">집중 타이머</h1>
      <TimerSetup subjects={subjects} currentUserId={session!.user.id} />
    </div>
  );
}
