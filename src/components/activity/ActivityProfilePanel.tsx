"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StudentProfileForm, type StudentProfileValue } from "@/components/profile/StudentProfileForm";

const FIELDS = ["major", "interests"] as const;

export function ActivityProfilePanel({ initialValue }: { initialValue: StudentProfileValue }) {
  const router = useRouter();
  const [open, setOpen] = useState(!(initialValue.interests || initialValue.major));

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-2 text-sm font-medium text-sb-text hover:underline"
      >
        {open ? "전공/관심분야 접기 ▲" : "전공/관심분야 입력·수정하기 ▼"}
      </button>
      {open && (
        <StudentProfileForm
          initialValue={initialValue}
          fields={[...FIELDS]}
          title="대외활동/공모전 매칭 정보"
          onSaved={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
