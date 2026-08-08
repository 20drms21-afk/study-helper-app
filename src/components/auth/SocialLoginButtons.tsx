"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";

interface ProviderInfo {
  id: string;
  name: string;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#191919"
        d="M9 1.5C4.582 1.5 1 4.26 1 7.664c0 2.163 1.442 4.066 3.616 5.157-.159.575-.575 2.08-.659 2.404-.104.4.147.395.309.287.128-.09 2.04-1.386 2.868-1.949.605.09 1.229.135 1.866.135 4.418 0 8-2.76 8-6.164C17 4.26 13.418 1.5 9 1.5z"
      />
    </svg>
  );
}

const PROVIDER_META: Record<
  string,
  { label: string; className: string; icon: () => React.JSX.Element }
> = {
  google: {
    label: "Google로 계속하기",
    className:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    icon: GoogleIcon,
  },
  kakao: {
    label: "카카오로 계속하기",
    className: "bg-[#FEE500] text-[#191919] hover:bg-[#fada00]",
    icon: KakaoIcon,
  },
};

export function SocialLoginButtons({ callbackUrl }: { callbackUrl: string }) {
  const [providers, setProviders] = useState<ProviderInfo[] | null>(null);

  useEffect(() => {
    getProviders().then((res) => {
      if (!res) return;
      setProviders(Object.values(res).filter((p) => p.id !== "credentials"));
    });
  }, []);

  if (!providers || providers.length === 0) return null;

  return (
    <div className="mt-6 space-y-2">
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <div className="h-px flex-1 bg-gray-200" />
        또는
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      {providers.map((p) => {
        const meta = PROVIDER_META[p.id];
        const Icon = meta?.icon;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => signIn(p.id, { callbackUrl })}
            className={`relative flex w-full items-center justify-center rounded-md py-2 text-sm font-medium ${
              meta?.className ?? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {Icon && (
              <span className="absolute left-3 inline-flex">
                <Icon />
              </span>
            )}
            {meta?.label ?? `${p.name}로 계속하기`}
          </button>
        );
      })}
    </div>
  );
}
