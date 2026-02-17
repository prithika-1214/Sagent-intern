import { ORDER_STATUS } from "../../utils/constants";

const steps = [ORDER_STATUS.CONFIRMED, ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.DELIVERED];

const getStepIndex = (status = "") => {
  const normalized = status.toLowerCase();
  if (normalized.includes("delivered")) return 2;
  if (normalized.includes("out for delivery")) return 1;
  if (
    normalized.includes("confirmed") ||
    normalized.includes("preparing") ||
    normalized.includes("picked")
  )
    return 0;
  return -1;
};

export default function OrderTimeline({ status }) {
  const stepIndex = getStepIndex(status);
  const cancelled = ["cancelled", "rejected"].includes((status || "").toLowerCase());

  if (cancelled) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
        This order is {status}.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const active = index <= stepIndex;
        return (
          <div key={step} className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${active ? "bg-brand-600" : "bg-slate-300"}`}
            />
            <p className={`text-sm ${active ? "text-slate-900" : "text-slate-500"}`}>{step}</p>
          </div>
        );
      })}
    </div>
  );
}
