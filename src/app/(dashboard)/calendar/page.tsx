import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CalendarBoard } from "@/components/calendar/CalendarBoard";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);

  const subjects = await prisma.subject.findMany({
    where: { userId: session!.user.id },
    orderBy: [{ isDefault: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, color: true },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">캘린더</h1>
      <CalendarBoard initialSubjects={subjects} />
    </div>
  );
}
