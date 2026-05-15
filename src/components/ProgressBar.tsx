type Props = {
  value: number;
  tone?: string;
  label?: string;
};

export function ProgressBar({ value, tone = "bg-zinc-950", label }: Props) {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
    >
      <div className={`h-2 rounded-full ${tone}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
