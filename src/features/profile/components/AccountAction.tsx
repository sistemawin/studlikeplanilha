"use client";

import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
  tone?: "neutral" | "danger";
  disabled?: boolean;
  onClick?: () => void;
};

export function AccountAction({
  icon,
  title,
  description,
  tone = "neutral",
  disabled = false,
  onClick,
}: Props) {
  const isDanger = tone === "danger";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-3 border-b border-slate-100 px-1 py-4 text-left transition last:border-0 focus-visible:outline focus-visible:outline-2 ${
        isDanger
          ? "hover:bg-red-50/30 focus-visible:outline-red-400"
          : "hover:bg-slate-50/70 focus-visible:outline-blue-500"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isDanger ? "text-red-500" : "text-slate-600"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className={`block text-sm font-semibold leading-5 ${isDanger ? "text-red-500" : "text-slate-600"}`}>
          {title}
        </span>
        <span className="mt-0.5 block text-xs font-normal leading-5 text-slate-400">
          {description}
        </span>
      </span>
    </button>
  );
}
