import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { InquiryStatusControl } from "@/components/admin/InquiryStatusControl";

export default async function AdminInquiriesPage() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    notFound();
  }

  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } } },
  });

  return (
    <div>
      <h1 className="text-xl font-bold">문의 관리</h1>

      {inquiries.length === 0 ? (
        <p className="mt-8 text-sm text-sb-mute">접수된 문의가 없습니다.</p>
      ) : (
        <ul className="mt-6 divide-y divide-sb-border rounded-md border border-sb-border">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sb-body">{inquiry.subject}</p>
                  <p className="text-xs text-sb-mute">
                    {inquiry.user.name ?? inquiry.user.email} ·{" "}
                    {new Date(inquiry.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>
                <InquiryStatusControl id={inquiry.id} status={inquiry.status} />
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-sb-text">{inquiry.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
