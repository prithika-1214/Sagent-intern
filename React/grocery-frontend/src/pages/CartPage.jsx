import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Loader from "../components/common/Loader";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import useCart from "../hooks/useCart";
import { formatCurrency } from "../utils/format";

export default function CartPage() {
  const navigate = useNavigate();
  const { items, loading, totals, updateQuantity, removeItem } = useCart();

  const handleDecrease = async (item) => {
    await updateQuantity(item, Number(item.quantity || 0) - 1);
  };

  const handleIncrease = async (item) => {
    await updateQuantity(item, Number(item.quantity || 0) + 1);
  };

  const handleRemove = async (item) => {
    await removeItem(item.id);
    toast.success("Item removed");
  };

  return (
    <div className="page-container">
      <PageHeader title="Cart" description="Review items before checkout." />

      {loading ? (
        <Loader label="Loading cart..." />
      ) : items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Browse products and add your first item."
          action={
            <Link to="/products" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
              Browse products
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.8fr,1fr]">
          <section className="card overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Quantity</th>
                  <th className="pb-3">Subtotal</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-3 font-medium text-slate-900">{item.name}</td>
                    <td className="py-3">{formatCurrency(item.price)}</td>
                    <td className="py-3">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDecrease(item)}
                          className="h-8 w-8 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleIncrease(item)}
                          className="h-8 w-8 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3 font-semibold text-slate-900">{formatCurrency(item.subtotal)}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => handleRemove(item)}
                        className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <aside className="card space-y-3">
            <h2 className="card-title">Summary</h2>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Cart total</span>
                <span>{formatCurrency(totals.cartTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Discount</span>
                <span>- {formatCurrency(totals.discount)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                <span>Final total</span>
                <span>{formatCurrency(totals.finalTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/checkout")}
              className="w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Proceed to checkout
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
