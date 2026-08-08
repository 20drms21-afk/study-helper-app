import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUS_LABEL: Record<string, string> = {
  open: "접수됨",
  answered: "답변완료",
  closed: "종료",
};

export default async function MyInquiriesPage() {
  const session = await getServerSession(authOptions);

  const inquiries = await prisma.inquiry.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, subject: true, message: true, status: true, createdAt: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">내 문의 내역</h1>
        <p className="mt-1 text-sm text-gray-600">
          내가 작성한 문의만 모아서 볼 수 있습니다.{" "}
          <Link href="/inquiries" className="underline">
            전체 문의 게시판
          </Link>
        </p>
      </div>

      <div className="mt-6">
        {inquiries.length === 0 ? (
          <p className="text-sm text-gray-600">아직 작성한 문의가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
            {inquiries.map((inquiry) => (
              <li key={inquiry.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{inquiry.subject}</p>
                  <span className="text-xs text-gray-500">
                    {STATUS_LABEL[inquiry.status] ?? inquiry.status}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{inquiry.message}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(inquiry.createdAt).toLocaleString("ko-KR")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
