import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getReviewQueueForUser } from "@/lib/review";
import { ReviewBoard } from "@/components/review/ReviewBoard";

export default async function ReviewPage() {
  const session = await getServerSession(authOptions);
  const queue = await getReviewQueueForUser(session!.user.id);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">오답노트</h1>
      <ReviewBoard initialToday={queue.today} initialBySubject={queue.bySubject} />
    </div>
  );
}
