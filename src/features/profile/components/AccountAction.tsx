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
      className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm shadow-slate-900/[0.03] ring-1 transition focus-visible:outline focus-visible:outline-2 ${
        isDanger
          ? "border-rose-100 ring-rose-950/[0.03] hover:bg-rose-50/70 focus-visible:outline-rose-500"
          : "border-slate-100 ring-slate-900/[0.03] hover:bg-slate-50 focus-visible:outline-blue-500"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
          isDanger ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-[#1877F2]"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className={`block text-sm font-bold leading-5 ${isDanger ? "text-rose-700" : "text-slate-950"}`}>
          {title}
        </span>
        <span className="mt-0.5 block text-xs font-medium leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </button>
  );
}
