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
        <p className="text-base leading-5 tracking-tight">
          <span className={`font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>
            studlike
          </span>
          <span className={`ml-1 font-medium ${isDark ? "text-blue-100/70" : "text-slate-500"}`}>
            foco
          </span>
        </p>
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
