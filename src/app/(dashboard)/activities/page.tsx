import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActivitiesForUser } from "@/lib/activity/match";
import { ActivityCard } from "@/components/activity/ActivityCard";
import { ActivityProfilePanel } from "@/components/activity/ActivityProfilePanel";

export default async function ActivitiesPage() {
  const session = await getServerSession(authOptions);
  const [profile, { profileComplete, activities }] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId: session!.user.id } }),
    getActivitiesForUser(session!.user.id),
  ]);

  const matchedCount = activities.filter((a) => (a.matchScore ?? 0) > 0).length;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-xl font-bold">대외활동/공모전</h1>

      <ActivityProfilePanel
        initialValue={{
          region: profile?.region ?? null,
          major: profile?.major ?? null,
          gradeLevel: profile?.gradeLevel ?? null,
          incomeBracket: profile?.incomeBracket ?? null,
          gpa: profile?.gpa ?? null,
          interests: profile?.interests ?? null,
        }}
      />

      {profileComplete && activities.length > 0 && (
        <p className="mb-4 text-sm text-gray-600">
          {matchedCount > 0
            ? `관심분야와 일치하는 ${matchedCount}개 항목을 위쪽에 먼저 보여드려요.`
            : "아직 관심분야와 일치하는 항목이 없어요. 관심분야를 더 넓게 적어보세요."}
        </p>
      )}

      {activities.length === 0 ? (
        <p className="mt-8 text-sm text-gray-600">
          아직 등록된 대외활동/공모전이 없습니다. 매일 자동으로 새로운 정보가 업데이트됩니다.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {activities.map((a) => (
            <ActivityCard key={a.id} activity={a} />
          ))}
        </ul>
      )}
    </div>
  );
}
