"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { CaretDown, Check } from "@phosphor-icons/react/dist/ssr";

// StudyBite 다크 올리브 테마 전용 커스텀 Select — 네이티브 <select>는 옵션 목록을 열면
// OS/브라우저 기본 흰색 드롭다운이 뜨는데(CSS로는 그 팝업 자체를 못 건드림), Radix UI는
// 옵션 목록(Content)까지 완전히 우리 마크업으로 그려서 Windows/Chrome 등 환경에 상관없이
// 항상 같은 다크 UI가 나온다. value/onValueChange만 넘기면 되는 얇은 래퍼로 만들어서
// 기존 form의 상태 관리(useState 등) 로직은 그대로 재사용할 수 있게 함.
export interface SelectOption {
  value: string;
  label: string;
}

// Radix Select.Item은 value=""를 예약값으로 취급해 허용하지 않는다 — "선택 안 함"류의
// 빈 값을 표현해야 하는 호출부는 이 sentinel을 옵션 value로 쓰고, onValueChange에서
// 실제 상태(보통 "" 또는 null)로 다시 변환한다.
export const SELECT_NONE_VALUE = "__none__";

// px-3 py-2 text-sm(기존 input들과 동일)이 기본, MaterialsLibrary처럼 리스트 행 안에 끼워 넣는
// 좁은 자리엔 size="sm"(px-2 py-1 text-xs)을 씀 — className으로 px/text 유틸을 덧붙이면 Tailwind
// 특이도가 동일해서 어느 쪽이 이길지 불확실해지므로, 크기는 별도 variant로 분리했다.
const SIZE_CLASS = {
  md: "px-3 py-2 text-sm",
  sm: "px-2 py-1 text-xs",
} as const;

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "선택",
  size = "md",
  className = "",
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange}>
      <RadixSelect.Trigger
        className={`flex w-full items-center justify-between rounded-lg border border-white/[0.08] bg-[#20281d] text-left text-[#f3f5ef] outline-none data-[placeholder]:text-[#98a38f] focus:border-sb-accent/40 ${SIZE_CLASS[size]} ${className}`}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon className="shrink-0 text-[#98a38f]">
          <CaretDown size={14} weight="bold" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="z-50 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[10px] border border-white/[0.08] bg-[#222a1f] text-[#d6dccf] shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
        >
          <RadixSelect.ScrollUpButton className="flex items-center justify-center py-1 text-[#98a38f]">
            <CaretDown size={12} weight="bold" className="rotate-180" />
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className="max-h-64 select-dark-scroll overflow-y-auto p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className={`relative flex cursor-pointer select-none items-center justify-between rounded-md px-3 py-2 outline-none data-[highlighted]:bg-[#2a3425] data-[state=checked]:bg-[#303d27] data-[state=checked]:text-sb-accent ${size === "sm" ? "text-xs" : "text-sm"}`}
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="ml-2 flex shrink-0 items-center text-sb-accent">
                  <Check size={14} weight="bold" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className="flex items-center justify-center py-1 text-[#98a38f]">
            <CaretDown size={12} weight="bold" />
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
