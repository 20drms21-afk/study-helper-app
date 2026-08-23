"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavDropdown({
  label,
  items,
  align = "left",
  dark = false,
}: {
  label: string;
  items: { href: string; label: string }[];
  align?: "left" | "right";
  dark?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const ref = useRef<HTMLDivElement>(null);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  const active = items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 text-sm font-medium ${
          dark
            ? active
              ? "text-sb-text"
              : "text-sb-mute hover:text-sb-text"
            : active
              ? "text-gray-900"
              : "text-gray-500 hover:text-gray-900"
        }`}
      >
        {label}
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M2.5 4.5L6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div
          className={`absolute top-full z-10 mt-2 w-44 rounded-xl py-1 ${
            align === "right" ? "right-0" : "left-0"
          } ${
            dark
              ? "glass-menu"
              : "border border-gray-200 bg-white shadow-lg"
          }`}
        >
          {items.map((item) => {
            const itemActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 text-sm ${
                  dark
                    ? itemActive
                      ? "font-medium text-sb-text"
                      : "text-sb-mute hover:text-sb-text"
                    : itemActive
                      ? "bg-gray-50 font-medium text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
