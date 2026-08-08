"use client";

import { useState } from "react";
import { InquiryForm } from "@/components/inquiries/InquiryForm";

export function InquiryFormToggle() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        {open ? "닫기" : "문의 등록하기"}
      </button>

      {open && (
        <div className="mt-4 rounded-md border border-gray-200 p-4">
          <InquiryForm onSuccess={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
