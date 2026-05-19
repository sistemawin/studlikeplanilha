type Props = {
  label: string;
  value: string;
};

export function ProfileField({ label, value }: Props) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm shadow-slate-900/[0.03] ring-1 ring-slate-900/[0.03]">
      <p className="text-[10px] font-bold uppercase leading-4 tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold leading-5 text-slate-950">
        {value}
      </p>
    </div>
  );
}
