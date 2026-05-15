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
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </button>
  );
}
