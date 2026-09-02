import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StudentProfileForm } from "@/components/profile/StudentProfileForm";
import { ScholarshipResults } from "@/components/scholarship/ScholarshipResults";

export default async function ScholarshipsPage() {
  const session = await getServerSession(authOptions);

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session!.user.id },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-bold">장학금</h1>
      <StudentProfileForm
        initialValue={{
          region: profile?.region ?? null,
          major: profile?.major ?? null,
          departmentField: profile?.departmentField ?? null,
          gradeLevel: profile?.gradeLevel ?? null,
          incomeBracket: profile?.incomeBracket ?? null,
          gpa: profile?.gpa ?? null,
          interests: profile?.interests ?? null,
        }}
        fields={["region", "major", "departmentField", "gradeLevel", "incomeBracket", "gpa"]}
        title="장학금 매칭 정보"
      />
      <ScholarshipResults />
    </div>
  );
}
