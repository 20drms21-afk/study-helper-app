import { prisma } from "@/lib/prisma";
import { InquiryFormToggle } from "@/components/inquiries/InquiryFormToggle";

const STATUS_LABEL: Record<string, string> = {
  open: "접수됨",
  answered: "답변완료",
  closed: "종료",
};

export default async function InquiriesPage() {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, subject: true, message: true, status: true, createdAt: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">문의하기</h1>
          <p className="mt-1 text-sm text-sb-mute">
            다른 사용자들의 문의를 익명으로 확인할 수 있습니다.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <InquiryFormToggle />
      </div>

      <div className="mt-6">
        {inquiries.length === 0 ? (
          <p className="text-sm text-sb-mute">아직 등록된 문의가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-sb-border rounded-md border border-sb-border">
            {inquiries.map((inquiry) => (
              <li key={inquiry.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-sb-body">{inquiry.subject}</p>
                  <span className="text-xs text-sb-mute">
                    {STATUS_LABEL[inquiry.status] ?? inquiry.status}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-sb-text">{inquiry.message}</p>
                <p className="mt-1 text-xs text-sb-mute/70">
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
