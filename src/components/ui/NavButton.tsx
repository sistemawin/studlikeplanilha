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
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-white text-[#1877F2] shadow-lg shadow-blue-950/15"
          : "text-blue-100/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          active ? "bg-blue-50" : "bg-white/5 group-hover:bg-white/10"
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
