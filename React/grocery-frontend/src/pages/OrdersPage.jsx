import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/common/Loader";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import StatusBadge from "../components/common/StatusBadge";
import useAuth from "../hooks/useAuth";
import orderService from "../services/orderService";
import { formatCurrency, formatDateTime } from "../utils/format";

export default function OrdersPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        const data = await orderService.getByUserId(user.id);
        const sorted = [...data].sort(
          (a, b) => new Date(b.orderTime || 0).getTime() - new Date(a.orderTime || 0).getTime(),
        );
        setOrders(sorted);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user.id]);

  return (
    <div className="page-container">
      <PageHeader
        title="My Orders"
        description="Track all your placed orders and current delivery status."
      />

      {loading ? (
        <Loader label="Loading orders..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Place your first order from the products page."
          action={
            <Link to="/products" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
              Browse products
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article key={order.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Order #{order.id}</p>
                <p className="text-sm text-slate-500">{formatDateTime(order.orderTime)}</p>
                <p className="mt-1 text-sm text-slate-700">Total: {formatCurrency(order.totalAmount)}</p>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                <Link
                  to={`/orders/${order.id}`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
