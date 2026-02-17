import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import PageHeader from "../components/common/PageHeader";
import Loader from "../components/common/Loader";
import EmptyState from "../components/common/EmptyState";
import StatusBadge from "../components/common/StatusBadge";
import orderService from "../services/orderService";
import deliveryService from "../services/deliveryService";
import deliveryAgentService from "../services/deliveryAgentService";
import notificationService from "../services/notificationService";
import { ORDER_STATUS } from "../utils/constants";
import { formatCurrency, formatDateTime } from "../utils/format";

const statusOptions = [
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
];

export default function StoreDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [agents, setAgents] = useState([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [orderData, deliveryData, agentData] = await Promise.all([
        orderService.getAll(),
        deliveryService.getAll(),
        deliveryAgentService.getAll(),
      ]);

      const sortedOrders = [...orderData].sort(
        (a, b) => new Date(b.orderTime || 0).getTime() - new Date(a.orderTime || 0).getTime(),
      );

      setOrders(sortedOrders);
      setDeliveries(deliveryData);
      setAgents(agentData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const deliveryMap = useMemo(
    () =>
      deliveries.reduce((acc, delivery) => {
        acc[delivery.orderId] = delivery;
        return acc;
      }, {}),
    [deliveries],
  );

  const agentMap = useMemo(
    () =>
      agents.reduce((acc, agent) => {
        acc[agent.id] = agent;
        return acc;
      }, {}),
    [agents],
  );

  const updateStatus = async (order, nextStatus) => {
    const updatedOrder = await orderService.update({ ...order, status: nextStatus });

    let nextDeliveries = [...deliveries];
    const now = new Date().toISOString();
    const existingDelivery = deliveryMap[order.id];

    if (existingDelivery) {
      const syncedDelivery = await deliveryService.update({
        ...existingDelivery,
        status: nextStatus,
        deliveryTime:
          nextStatus === ORDER_STATUS.DELIVERED ? now : existingDelivery.deliveryTime || now,
      });
      nextDeliveries = nextDeliveries.map((entry) =>
        Number(entry.id) === Number(syncedDelivery.id) ? syncedDelivery : entry,
      );
    } else if (
      [ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.DELIVERED].includes(nextStatus)
    ) {
      const createdDelivery = await deliveryService.create({
        orderId: order.id,
        agentId: agents[0]?.id || null,
        status: nextStatus,
        deliveryTime: nextStatus === ORDER_STATUS.DELIVERED ? now : null,
      });
      nextDeliveries = [...nextDeliveries, createdDelivery];
    }

    await notificationService.create({
      userId: order.userId,
      orderId: order.id,
      message: `Order #${order.id} is ${nextStatus}`,
      type: "ORDER_UPDATE",
      isRead: false,
      createdAt: now,
    });

    setOrders((current) =>
      current.map((entry) => (Number(entry.id) === Number(updatedOrder.id) ? updatedOrder : entry)),
    );
    setDeliveries(nextDeliveries);
    toast.success("Order status updated");
  };

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Store Dashboard"
        description="Manage incoming orders and update fulfillment status."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/admin/products"
          className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Manage Products
        </Link>
        <Link
          to="/admin/categories"
          className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Manage Categories
        </Link>
      </div>

      {loading ? (
        <Loader label="Loading store dashboard..." />
      ) : orders.length === 0 ? (
        <EmptyState title="No incoming orders" description="Orders will appear here after checkout." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-3">Order</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Placed</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Assigned Agent</th>
                <th className="pb-3">Update</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const delivery = deliveryMap[order.id];
                const agent = delivery ? agentMap[delivery.agentId] : null;

                return (
                  <tr key={order.id} className="border-b border-slate-100 align-top">
                    <td className="py-3 font-medium text-slate-900">#{order.id}</td>
                    <td className="py-3">User #{order.userId}</td>
                    <td className="py-3">{formatCurrency(order.totalAmount)}</td>
                    <td className="py-3">{formatDateTime(order.orderTime)}</td>
                    <td className="py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 text-xs text-slate-600">
                      {agent ? (
                        <>
                          <p className="font-semibold text-slate-700">{agent.name}</p>
                          <p>{agent.phone}</p>
                          <p>{agent.vehicleNo}</p>
                        </>
                      ) : (
                        <span>Not assigned</span>
                      )}
                    </td>
                    <td className="py-3">
                      <select
                        value={order.status || ORDER_STATUS.CONFIRMED}
                        onChange={(event) => updateStatus(order, event.target.value)}
                        className="rounded-md border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-brand-500"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
