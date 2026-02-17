import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import Loader from "../components/common/Loader";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import StatusBadge from "../components/common/StatusBadge";
import OrderTimeline from "../components/orders/OrderTimeline";
import orderService from "../services/orderService";
import cartItemService from "../services/cartItemService";
import productService from "../services/productService";
import deliveryService from "../services/deliveryService";
import deliveryAgentService from "../services/deliveryAgentService";
import notificationService from "../services/notificationService";
import { ORDER_STATUS } from "../utils/constants";
import { formatCurrency, formatDateTime } from "../utils/format";

export default function OrderDetailPage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [delivery, setDelivery] = useState(null);
  const [agent, setAgent] = useState(null);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    try {
      const orderData = await orderService.getById(id);
      setOrder(orderData);

      if (!orderData) {
        setItems([]);
        setDelivery(null);
        setAgent(null);
        return;
      }

      const [cartItems, products, deliveryData, agents] = await Promise.all([
        cartItemService.getAll(),
        productService.getAll(),
        deliveryService.getByOrderId(orderData.id),
        deliveryAgentService.getAll(),
      ]);

      const selectedItems = cartItems.filter(
        (item) => Number(item.cartId) === Number(orderData.cartId),
      );
      const productMap = new Map(products.map((product) => [Number(product.id), product]));

      const hydratedItems = selectedItems.map((item) => {
        const product = productMap.get(Number(item.productId)) || {};
        const price = Number(item.priceAtTime ?? product.price ?? 0);
        return {
          ...item,
          name: product.name || `Product #${item.productId}`,
          subtotal: price * Number(item.quantity || 0),
          price,
        };
      });

      setItems(hydratedItems);
      setDelivery(deliveryData);
      setAgent(
        deliveryData
          ? agents.find((entry) => Number(entry.id) === Number(deliveryData.agentId)) || null
          : null,
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const canCancel = useMemo(() => {
    const status = (order?.status || "").toLowerCase();
    return order && !["delivered", "cancelled", "rejected"].includes(status);
  }, [order]);

  const handleCancel = async () => {
    if (!order) return;

    const updated = await orderService.update({
      ...order,
      status: ORDER_STATUS.CANCELLED,
    });

    await notificationService.create({
      userId: order.userId,
      orderId: order.id,
      message: `Order #${order.id} cancelled`,
      type: "ORDER_UPDATE",
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    setOrder(updated);
    toast.success("Order cancelled");
  };

  const trackingStatus = delivery?.status || order?.status;

  if (loading) {
    return (
      <div className="page-container">
        <Loader label="Loading order details..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-container">
        <EmptyState
          title="Order not found"
          description="This order does not exist or may have been deleted."
          action={
            <Link to="/orders" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
              Back to orders
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title={`Order #${order.id}`}
        description={`Placed on ${formatDateTime(order.orderTime)}`}
        action={
          canCancel ? (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              Cancel order
            </button>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.7fr,1fr]">
        <section className="space-y-4">
          <article className="card">
            <h2 className="card-title">Order Items</h2>
            {items.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No cart items available for this order.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-slate-700">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="card">
            <h2 className="card-title">Delivery Details</h2>
            <p className="mt-2 text-sm text-slate-600">Address: {order.deliveryAddress || "-"}</p>
            <p className="mt-1 text-sm text-slate-600">Status: <StatusBadge status={trackingStatus} /></p>

            {delivery ? (
              <div className="mt-3 rounded-md border border-slate-200 p-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Delivery ID:</span> {delivery.id}
                </p>
                <p>
                  <span className="font-semibold">Delivery status:</span> {delivery.status || "-"}
                </p>
                <p>
                  <span className="font-semibold">Delivery time:</span> {formatDateTime(delivery.deliveryTime)}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Delivery assignment not available yet.</p>
            )}

            {agent && (
              <div className="mt-3 rounded-md border border-brand-100 bg-brand-50 p-3 text-sm text-brand-900">
                <p className="font-semibold">Assigned Agent</p>
                <p>{agent.name}</p>
                <p>Phone: {agent.phone}</p>
                <p>Vehicle: {agent.vehicleNo}</p>
              </div>
            )}
          </article>
        </section>

        <aside className="space-y-4">
          <article className="card space-y-3">
            <h2 className="card-title">Tracking Timeline</h2>
            <OrderTimeline status={trackingStatus} />
          </article>

          <article className="card space-y-2 text-sm text-slate-700">
            <h2 className="card-title">Payment Summary</h2>
            <div className="flex items-center justify-between">
              <span>Order total</span>
              <span className="font-semibold text-slate-900">{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <StatusBadge status={order.status} />
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}
