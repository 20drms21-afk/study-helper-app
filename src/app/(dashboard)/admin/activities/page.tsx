import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { ActivityDeleteControl } from "@/components/admin/ActivityDeleteControl";

export default async function AdminActivitiesPage() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    notFound();
  }

  const activities = await prisma.activityListing.findMany({
    orderBy: { fetchedAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-xl font-bold">공모전/대외활동 관리</h1>
      <p className="mt-1 text-sm text-gray-600">
        매일 동기화 시 마감일이 지난 항목은 자동으로 삭제됩니다. 그 외에 부적절한 항목은
        직접 삭제해주세요.
      </p>

      {activities.length === 0 ? (
        <p className="mt-8 text-sm text-gray-600">등록된 항목이 없습니다.</p>
      ) : (
        <ul className="mt-6 divide-y divide-gray-200 rounded-md border border-gray-200">
          {activities.map((a) => (
            <li key={a.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    <span className="mr-2 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {a.category === "contest" ? "공모전" : "대외활동"}
                    </span>
                    {a.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {a.organizer || "주최기관 미상"} · {a.fieldTags} ·{" "}
                    {new Date(a.fetchedAt).toLocaleString("ko-KR")} 수집
                  </p>
                  <a
                    href={a.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-gray-500 hover:text-gray-900 hover:underline"
                  >
                    {a.sourceUrl}
                  </a>
                </div>
                <ActivityDeleteControl id={a.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
