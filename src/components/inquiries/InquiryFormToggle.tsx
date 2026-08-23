"use client";

import { useState } from "react";
import { InquiryForm } from "@/components/inquiries/InquiryForm";

export function InquiryFormToggle() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full bg-sb-accent px-4 py-2 text-sm font-medium text-sb-accent-ink hover:-translate-y-0.5"
      >
        {open ? "닫기" : "문의 등록하기"}
      </button>

      {open && (
        <div className="mt-4 rounded-md border border-sb-border p-4">
          <InquiryForm onSuccess={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
