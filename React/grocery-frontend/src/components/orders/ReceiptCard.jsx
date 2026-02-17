import { formatCurrency, formatDateTime } from "../../utils/format";

export default function ReceiptCard({ receipt }) {
  if (!receipt) return null;

  return (
    <div className="card space-y-3 border-emerald-200 bg-emerald-50">
      <h3 className="card-title text-emerald-800">Order placed successfully</h3>
      <div className="grid gap-2 text-sm text-emerald-900 sm:grid-cols-2">
        <p>
          <span className="font-semibold">Order ID:</span> {receipt.orderId}
        </p>
        <p>
          <span className="font-semibold">Created:</span> {formatDateTime(receipt.createdAt)}
        </p>
        <p>
          <span className="font-semibold">Payment:</span> {receipt.paymentMethod}
        </p>
        <p>
          <span className="font-semibold">Total:</span> {formatCurrency(receipt.finalTotal)}
        </p>
      </div>
      <div>
        <p className="mb-1 text-sm font-semibold text-emerald-900">Items</p>
        <ul className="list-inside list-disc text-sm text-emerald-900">
          {receipt.items.map((item) => (
            <li key={item.id || item.productId}>
              {item.name} x {item.quantity}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
