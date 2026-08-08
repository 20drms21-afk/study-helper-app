import { useId } from "react";

export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  const maskId = `studybite-bite-${useId().replace(/:/g, "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <mask id={maskId}>
        <rect width="64" height="64" fill="white" />
        <circle cx="52" cy="17" r="10" fill="black" />
      </mask>
      <path fill="currentColor" d="M8,20 L31,10 L31,54 L8,44 Z" />
      <path fill="currentColor" mask={`url(#${maskId})`} d="M33,10 L56,20 L56,44 L33,54 Z" />
    </svg>
  );
}
