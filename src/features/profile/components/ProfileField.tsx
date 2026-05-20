type Props = {
  label: string;
  value: string;
  muted?: boolean;
};

export function ProfileField({ label, value, muted = false }: Props) {
  return (
    <div className="border-b border-slate-100 py-3.5 last:border-0">
      <p className="mb-1 text-[10px] font-bold uppercase leading-4 tracking-wider text-slate-400">
        {label}
      </p>
      <p className={`break-words text-sm leading-5 ${muted ? "font-normal italic text-slate-400" : "font-semibold text-slate-700"}`}>
        {value}
      </p>
    </div>
  );
}
