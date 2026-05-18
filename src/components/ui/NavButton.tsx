import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
};

export function NavButton({ icon: Icon, label, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group flex h-14 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold leading-none transition duration-200 ${
        active
          ? "bg-blue-50 text-[#1877F2] shadow-sm ring-1 ring-blue-100"
          : "text-slate-500 hover:bg-slate-100 hover:text-[#1877F2]"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
          active ? "bg-white text-[#1877F2] shadow-sm" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[#1877F2]"
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}
