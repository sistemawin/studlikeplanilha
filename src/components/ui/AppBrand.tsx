import { StudlikeLogo } from "./StudlikeLogo";

type Props = {
  theme?: "light" | "dark";
  logoSize?: number;
  showSubtitle?: boolean;
  className?: string;
};

export function AppBrand({
  theme = "light",
  logoSize = 44,
  showSubtitle = false,
  className = "",
}: Props) {
  const isDark = theme === "dark";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <StudlikeLogo
        size={logoSize}
        className={
          isDark
            ? "rounded-xl shadow-lg shadow-blue-950/25 ring-1 ring-white/15"
            : "rounded-xl shadow-sm shadow-slate-900/10 ring-1 ring-slate-900/5"
        }
      />
      <div>
        <div className="flex items-center justify-center rounded-lg bg-white px-3 py-2 shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/5">
          <p className="font-rubik-vinyl flex items-baseline leading-none tracking-normal">
            <span className="text-xl text-slate-950">
              StudLike
            </span>
            <span className="ml-2 text-sm uppercase text-slate-600">
              Foco
            </span>
          </p>
        </div>
        {showSubtitle && (
          <p
            className={`mt-0.5 text-[11px] font-medium leading-4 ${
              isDark ? "text-blue-100/60" : "text-slate-500"
            }`}
          >
            Plano de estudos
          </p>
        )}
      </div>
    </div>
  );
}
