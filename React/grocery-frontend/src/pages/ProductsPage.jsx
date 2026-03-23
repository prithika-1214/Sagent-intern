import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Loader from "../components/common/Loader";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import categoryService from "../services/categoryService";
import productService from "../services/productService";
import useCart from "../hooks/useCart";
import useAuth from "../hooks/useAuth";
import { formatCurrency } from "../utils/format";

export default function ProductsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [productData, categoryData] = await Promise.all([
          productService.getAll(),
          categoryService.getAll(),
        ]);
        setProducts(productData);
        setCategories(categoryData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const categoryById = useMemo(
    () =>
      categories.reduce((acc, category) => {
        acc[category.id] = category.name;
        return acc;
      }, {}),
    [categories],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const byCategory =
        selectedCategory === "all" || Number(product.categoryId) === Number(selectedCategory);
      const byQuery =
        !query ||
        (product.name || "").toLowerCase().includes(query) ||
        (categoryById[product.categoryId] || "").toLowerCase().includes(query);
      return byCategory && byQuery;
    });
  }, [products, search, selectedCategory, categoryById]);

  const handleAdd = async (product) => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }

    await addItem(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Products"
        description="Browse by category, search products, and add items to your cart."
      />

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by product name or category"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            selectedCategory === "all"
              ? "bg-brand-600 text-white"
              : "bg-white text-slate-700 ring-1 ring-slate-300"
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setSelectedCategory(String(category.id))}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              Number(selectedCategory) === Number(category.id)
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-300"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader label="Loading products..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try adjusting search keywords or category filters."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <article key={product.id} className="card flex flex-col gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  {categoryById[product.categoryId] || "Uncategorized"}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{product.name}</h3>
              </div>

              <p className="text-sm text-slate-500">
                Availability: {product.available ? "In Stock" : "Out of Stock"}
              </p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(product.price)}</p>

              <div className="mt-auto flex items-center gap-2">
                <Link
                  to={`/products/${product.id}`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => handleAdd(product)}
                  disabled={!product.available}
                  className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add to cart
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
