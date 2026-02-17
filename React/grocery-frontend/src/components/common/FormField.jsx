export default function FormField({
  label,
  error,
  inputClassName = "",
  containerClassName = "",
  ...inputProps
}) {
  return (
    <div className={containerClassName || ""}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        {...inputProps}
        className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition ${
          error
            ? "border-rose-400 focus:border-rose-500"
            : "border-slate-300 focus:border-brand-500"
        } ${inputClassName}`}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
