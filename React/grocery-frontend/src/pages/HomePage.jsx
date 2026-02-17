import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="page-container">
      <section className="rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 p-8 text-white shadow-soft">
        <p className="text-sm uppercase tracking-[0.25em] text-brand-100">Grocery Delivery</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
          Fresh groceries at your doorstep.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-brand-100 sm:text-base">
          Browse products, manage your cart, checkout securely, and track each delivery in real time.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/products"
            className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Shop Products
          </Link>
          <Link
            to="/orders"
            className="rounded-md border border-brand-100 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Track Orders
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="card">
          <h2 className="card-title">Smart Checkout</h2>
          <p className="mt-2 text-sm text-slate-600">
            Automatic Rs. 25 discount when cart total exceeds Rs. 200.
          </p>
        </article>

        <article className="card">
          <h2 className="card-title">Order Timeline</h2>
          <p className="mt-2 text-sm text-slate-600">
            Follow every stage from confirmation to delivery.
          </p>
        </article>

        <article className="card">
          <h2 className="card-title">Role Dashboards</h2>
          <p className="mt-2 text-sm text-slate-600">
            Dedicated interfaces for customers, stores, and delivery agents.
          </p>
        </article>
      </section>
    </div>
  );
}
