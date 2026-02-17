import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import Loader from "../components/common/Loader";
import EmptyState from "../components/common/EmptyState";
import productService from "../services/productService";
import categoryService from "../services/categoryService";
import useCart from "../hooks/useCart";
import useAuth from "../hooks/useAuth";
import { formatCurrency } from "../utils/format";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [categoryName, setCategoryName] = useState("-");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await productService.getById(id);
        setProduct(data);

        if (data?.categoryId) {
          const category = await categoryService.getById(data.categoryId);
          setCategoryName(category?.name || "-");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleAdd = async () => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }

    await addItem(product, quantity);
    toast.success("Item added to cart");
    navigate("/cart");
  };

  if (loading) {
    return (
      <div className="page-container">
        <Loader label="Loading product..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-container">
        <EmptyState
          title="Product not found"
          description="The product may have been removed."
          action={
            <Link to="/products" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
              Back to products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        <section className="card">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">{categoryName}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{product.name}</h1>
          <p className="mt-4 text-sm text-slate-500">Product ID: {product.id}</p>
          <p className="mt-2 text-sm text-slate-600">
            Availability: {product.available ? "In Stock" : "Out of Stock"}
          </p>
          <p className="mt-6 text-2xl font-bold text-slate-900">{formatCurrency(product.price)}</p>
        </section>

        <aside className="card space-y-4">
          <h2 className="card-title">Add to cart</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value || 1)))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>

          <button
            type="button"
            disabled={!product.available}
            onClick={handleAdd}
            className="w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add to cart
          </button>

          <Link
            to="/products"
            className="inline-block text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Back to products
          </Link>
        </aside>
      </div>
    </div>
  );
}
