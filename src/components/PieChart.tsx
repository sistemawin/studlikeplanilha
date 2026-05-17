import { BarChart3 } from "lucide-react";
import type { ChartSlice } from "@/types";
import { pct, pieBackground } from "@/lib/utils";

type Props = {
  title: string;
  subtitle: string;
  slices: ChartSlice[];
  centerLabel: string;
};

export function PieChart({ title, subtitle, slices, centerLabel }: Props) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const chart = (
    <div
      role="img"
      aria-label={`Gráfico: ${title}`}
      className="relative mx-auto h-28 w-28 max-w-full shrink-0 rounded-full shadow-inner shadow-slate-900/10 sm:h-32 sm:w-32 xl:h-40 xl:w-40"
      style={{ background: pieBackground(slices) }}
    >
      <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-sm sm:inset-4 xl:inset-5">
        <span className="text-lg font-semibold text-slate-950 sm:text-xl xl:text-2xl">{centerLabel}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:text-[11px]">total</span>
      </div>
    </div>
  );

  const legend = (
    <div className="w-full min-w-0 space-y-3">
      {slices.map((slice) => (
        <div key={slice.label} className="min-w-0">
          <div className="mb-1 flex min-w-0 items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 font-medium text-slate-700">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
                aria-hidden="true"
              />
              <span className="min-w-0 break-words leading-5 [overflow-wrap:anywhere]">{slice.label}</span>
            </span>
            <span className="shrink-0 font-semibold text-slate-950">
              {total === 0 ? 0 : pct(slice.value, total)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${total === 0 ? 0 : pct(slice.value, total)}%`,
                backgroundColor: slice.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="box-border w-full max-w-full overflow-hidden rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/5 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1877F2]">Analytics</p>
          <h2 className="mt-1 break-words text-xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 break-words text-sm leading-6 text-slate-500 [overflow-wrap:anywhere]">{subtitle}</p>
        </div>
        <BarChart3 className="h-5 w-5 shrink-0 text-blue-500" aria-hidden="true" />
      </div>

      <div className="mt-4 flex w-full min-w-0 flex-col items-center gap-4 sm:mt-5 xl:hidden">
        {chart}
        {legend}
      </div>

      <div className="mt-5 hidden min-w-0 grid-cols-[160px_minmax(0,1fr)] items-center gap-5 xl:grid">
        {chart}
        {legend}
      </div>
    </div>
  );
}
