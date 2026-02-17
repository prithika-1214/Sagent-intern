import { normalizeStatus } from "../../utils/format";

const colorMap = {
  "order confirmed": "bg-blue-100 text-blue-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-amber-100 text-amber-800",
  "picked up": "bg-indigo-100 text-indigo-700",
  "out for delivery": "bg-yellow-100 text-yellow-800",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
  rejected: "bg-rose-100 text-rose-700",
};

export default function StatusBadge({ status }) {
  const key = normalizeStatus(status).toLowerCase();
  const style = colorMap[key] || "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {status || "Unknown"}
    </span>
  );
}
