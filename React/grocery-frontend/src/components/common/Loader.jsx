export default function Loader({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
