"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useEffect } from "react";

export type FeedbackTone = "success" | "error" | "info";

export type AppFeedback = {
  id: number;
  message: string;
  tone: FeedbackTone;
};

type Props = {
  feedback: AppFeedback | null;
  onClose: () => void;
};

const toneStyles: Record<FeedbackTone, { icon: typeof CheckCircle2; shell: string; iconWrap: string; title: string }> = {
  success: {
    icon: CheckCircle2,
    shell: "border-emerald-200 bg-white text-emerald-950 shadow-emerald-950/12",
    iconWrap: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    title: "Ação concluída",
  },
  error: {
    icon: AlertCircle,
    shell: "border-rose-200 bg-white text-rose-950 shadow-rose-950/12",
    iconWrap: "bg-rose-50 text-rose-600 ring-rose-100",
    title: "Atenção",
  },
  info: {
    icon: Info,
    shell: "border-blue-200 bg-white text-slate-950 shadow-blue-950/12",
    iconWrap: "bg-blue-50 text-[#1877F2] ring-blue-100",
    title: "Studlike",
  },
};

export function AppFeedbackToast({ feedback, onClose }: Props) {
  useEffect(() => {
    if (!feedback) return;

    const timeout = window.setTimeout(onClose, 4600);
    return () => window.clearTimeout(timeout);
  }, [feedback, onClose]);

  if (!feedback) return null;

  const tone = toneStyles[feedback.tone];
  const Icon = tone.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex justify-center px-3 sm:top-5"
    >
      <div
        key={feedback.id}
        className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border p-3 shadow-2xl ring-1 ring-slate-900/5 backdrop-blur-xl animate-in slide-in-from-top-3 fade-in duration-200 ${tone.shell}`}
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${tone.iconWrap}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-bold leading-5">{tone.title}</p>
          <p className="mt-0.5 text-sm font-medium leading-5 text-slate-600">{feedback.message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar feedback"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
