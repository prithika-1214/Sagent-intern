import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import ReceiptCard from "../components/orders/ReceiptCard";
import useAuth from "../hooks/useAuth";
import useCart from "../hooks/useCart";
import orderService from "../services/orderService";
import paymentService from "../services/paymentService";
import storeService from "../services/storeService";
import notificationService from "../services/notificationService";
import { ORDER_STATUS, PAYMENT_METHODS } from "../utils/constants";
import { formatCurrency } from "../utils/format";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, items, loading, totals, clearCart } = useCart();

  const [stores, setStores] = useState([]);
  const [addressMode, setAddressMode] = useState(user?.address ? "saved" : "new");
  const [newAddress, setNewAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    const loadStores = async () => {
      const data = await storeService.getAll();
      setStores(data || []);
    };

    loadStores();
  }, []);

  const selectedAddress = useMemo(() => {
    if (addressMode === "saved") return user?.address || "";
    return newAddress.trim();
  }, [addressMode, newAddress, user?.address]);

  const placeOrder = async () => {
    if (!items.length) return;
    if (!selectedAddress) {
      toast.error("Please provide a delivery address.");
      return;
    }

    setPlacingOrder(true);
    try {
      const now = new Date().toISOString();
      const orderPayload = {
        userId: user.id,
        cartId: cart?.id,
        storeId: Number(stores[0]?.id || 1),
        status: ORDER_STATUS.CONFIRMED,
        totalAmount: totals.finalTotal,
        orderTime: now,
        deliveryAddress: selectedAddress,
      };

      const createdOrder = await orderService.create(orderPayload);

      const paymentPayload = {
        orderId: createdOrder.id,
        method: paymentMethod,
        amount: totals.finalTotal,
        status: paymentMethod === "Cash on Delivery" ? "PENDING" : "INITIATED",
        paidTime: now,
      };

      await paymentService.create(paymentPayload);

      await notificationService.create({
        userId: user.id,
        orderId: createdOrder.id,
        message: `Order #${createdOrder.id} confirmed`,
        type: "ORDER_UPDATE",
        isRead: false,
        createdAt: now,
      });

      const receiptData = {
        orderId: createdOrder.id,
        createdAt: now,
        paymentMethod,
        finalTotal: totals.finalTotal,
        items,
      };

      setReceipt(receiptData);
      await clearCart();
      toast.success("Order placed successfully");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Loader label="Preparing checkout..." />
      </div>
    );
  }

  if (!items.length && !receipt) {
    return (
      <div className="page-container">
        <EmptyState
          title="No items to checkout"
          description="Add products to your cart before placing an order."
          action={
            <Link to="/products" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
              Go to products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Checkout"
        description="Review cart summary, choose payment option, and confirm delivery address."
      />

      {receipt && <ReceiptCard receipt={receipt} />}

      {items.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[1.7fr,1fr]">
          <section className="space-y-4">
            <div className="card space-y-3">
              <h2 className="card-title">Delivery Address</h2>

              {user?.address ? (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="addressMode"
                      checked={addressMode === "saved"}
                      onChange={() => setAddressMode("saved")}
                    />
                    Use saved address: {user.address}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="addressMode"
                      checked={addressMode === "new"}
                      onChange={() => setAddressMode("new")}
                    />
                    Add new address
                  </label>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No saved address. Please add a new delivery address.</p>
              )}

              {(addressMode === "new" || !user?.address) && (
                <textarea
                  value={newAddress}
                  onChange={(event) => setNewAddress(event.target.value)}
                  rows={3}
                  placeholder="Enter delivery address"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
              )}
            </div>

            <div className="card space-y-3">
              <h2 className="card-title">Payment Method</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method}
                    className={`cursor-pointer rounded-md border p-3 text-sm font-medium ${
                      paymentMethod === method
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                      className="mr-2"
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>
          </section>

          <aside className="card space-y-3">
            <h2 className="card-title">Order Summary</h2>

            <ul className="space-y-2 text-sm">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-slate-600">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>{formatCurrency(item.subtotal)}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-2 border-t border-slate-200 pt-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Cart total</span>
                <span>{formatCurrency(totals.cartTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Discount</span>
                <span>- {formatCurrency(totals.discount)}</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-slate-900">
                <span>Final total</span>
                <span>{formatCurrency(totals.finalTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={placeOrder}
              disabled={placingOrder}
              className="w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {placingOrder ? "Placing order..." : "Confirm and place order"}
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
