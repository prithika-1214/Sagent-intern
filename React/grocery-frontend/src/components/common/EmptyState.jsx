export default function EmptyState({ title, description, action }) {
  return (
    <div className="card flex min-h-[180px] flex-col items-center justify-center text-center">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
