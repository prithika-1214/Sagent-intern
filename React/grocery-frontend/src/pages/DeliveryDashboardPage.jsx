import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import PageHeader from "../components/common/PageHeader";
import Loader from "../components/common/Loader";
import EmptyState from "../components/common/EmptyState";
import StatusBadge from "../components/common/StatusBadge";
import deliveryService from "../services/deliveryService";
import orderService from "../services/orderService";
import deliveryAgentService from "../services/deliveryAgentService";
import userService from "../services/userService";
import notificationService from "../services/notificationService";
import useAuth from "../hooks/useAuth";
import { DELIVERY_STATUS, ORDER_STATUS } from "../utils/constants";
import { formatDateTime } from "../utils/format";

const statusOptions = [
  DELIVERY_STATUS.PICKED_UP,
  DELIVERY_STATUS.OUT_FOR_DELIVERY,
  DELIVERY_STATUS.DELIVERED,
];

const orderStatusByDelivery = {
  [DELIVERY_STATUS.PICKED_UP]: ORDER_STATUS.CONFIRMED,
  [DELIVERY_STATUS.OUT_FOR_DELIVERY]: ORDER_STATUS.OUT_FOR_DELIVERY,
  [DELIVERY_STATUS.DELIVERED]: ORDER_STATUS.DELIVERED,
};

export default function DeliveryDashboardPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [agents, setAgents] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [deliveryData, orderData, userData, agentData] = await Promise.all([
        deliveryService.getAll(),
        orderService.getAll(),
        userService.getAll(),
        deliveryAgentService.getAll(),
      ]);

      setDeliveries(deliveryData);
      setOrders(orderData);
      setUsers(userData);
      setAgents(agentData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentAgent = useMemo(() => {
    return (
      agents.find((agent) => Number(agent.id) === Number(user?.id)) ||
      agents.find((agent) => (agent.name || "").toLowerCase() === (user?.name || "").toLowerCase()) ||
      null
    );
  }, [agents, user?.id, user?.name]);

  const orderMap = useMemo(
    () => orders.reduce((acc, order) => ({ ...acc, [order.id]: order }), {}),
    [orders],
  );

  const userMap = useMemo(
    () => users.reduce((acc, entry) => ({ ...acc, [entry.id]: entry }), {}),
    [users],
  );

  const visibleDeliveries = useMemo(() => {
    if (!deliveries.length) return [];
    if (!currentAgent) return deliveries;

    const assigned = deliveries.filter(
      (delivery) => Number(delivery.agentId) === Number(currentAgent.id),
    );

    return assigned.length > 0 ? assigned : deliveries;
  }, [deliveries, currentAgent]);

  const updateDeliveryStatus = async (delivery, nextStatus) => {
    const now = new Date().toISOString();

    const updatedDelivery = await deliveryService.update({
      ...delivery,
      status: nextStatus,
      deliveryTime: nextStatus === DELIVERY_STATUS.DELIVERED ? now : delivery.deliveryTime || now,
    });

    const relatedOrder = orderMap[delivery.orderId];
    if (relatedOrder) {
      const updatedOrder = await orderService.update({
        ...relatedOrder,
        status: orderStatusByDelivery[nextStatus],
      });

      setOrders((current) =>
        current.map((entry) =>
          Number(entry.id) === Number(updatedOrder.id) ? updatedOrder : entry,
        ),
      );

      await notificationService.create({
        userId: relatedOrder.userId,
        orderId: relatedOrder.id,
        message: `Order #${relatedOrder.id} is ${orderStatusByDelivery[nextStatus]}`,
        type: "ORDER_UPDATE",
        isRead: false,
        createdAt: now,
      });
    }

    setDeliveries((current) =>
      current.map((entry) =>
        Number(entry.id) === Number(updatedDelivery.id) ? updatedDelivery : entry,
      ),
    );

    toast.success("Delivery status updated");
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Delivery Dashboard"
        description={
          currentAgent
            ? `Logged in as ${currentAgent.name} (${currentAgent.phone})`
            : "Showing assigned deliveries"
        }
      />

      {loading ? (
        <Loader label="Loading assigned deliveries..." />
      ) : visibleDeliveries.length === 0 ? (
        <EmptyState
          title="No deliveries assigned"
          description="Assignments will appear once store confirms orders."
        />
      ) : (
        <div className="space-y-3">
          {visibleDeliveries.map((delivery) => {
            const order = orderMap[delivery.orderId];
            const customer = order ? userMap[order.userId] : null;

            return (
              <article key={delivery.id} className="card">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">
                      Delivery #{delivery.id} | Order #{delivery.orderId}
                    </p>
                    <p className="text-sm text-slate-600">
                      Delivery Status: <StatusBadge status={delivery.status} />
                    </p>
                    <p className="text-sm text-slate-600">
                      Delivery Time: {formatDateTime(delivery.deliveryTime)}
                    </p>
                    {customer ? (
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">Customer Contact</p>
                        <p>Name: {customer.name}</p>
                        <p>Phone: {customer.contact}</p>
                        <p>Address: {order?.deliveryAddress || customer.address || "-"}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Customer details unavailable.</p>
                    )}
                  </div>

                  <div className="min-w-48">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Update Status
                    </label>
                    <select
                      value={delivery.status || DELIVERY_STATUS.PICKED_UP}
                      onChange={(event) => updateDeliveryStatus(delivery, event.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
