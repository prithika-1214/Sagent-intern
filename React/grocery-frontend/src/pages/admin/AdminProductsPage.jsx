import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import FormField from "../../components/common/FormField";
import productService from "../../services/productService";
import categoryService from "../../services/categoryService";
import { formatCurrency } from "../../utils/format";

const schema = yup.object({
  name: yup.string().trim().required("Product name is required"),
  price: yup.number().typeError("Price must be a number").positive().required(),
  categoryId: yup.number().typeError("Category is required").required(),
  available: yup.boolean().required(),
});

export default function AdminProductsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      price: "",
      categoryId: "",
      available: true,
    },
  });

  const categoryMap = useMemo(
    () =>
      categories.reduce((acc, category) => {
        acc[category.id] = category.name;
        return acc;
      }, {}),
    [categories],
  );

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

  useEffect(() => {
    loadData();
  }, []);

  const clearForm = () => {
    reset({ name: "", price: "", categoryId: "", available: true });
    setEditingId(null);
  };

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      price: Number(values.price),
      categoryId: Number(values.categoryId),
      available: values.available === true || values.available === "true",
    };

    if (editingId) {
      const updated = await productService.update({
        id: editingId,
        ...payload,
      });
      setProducts((current) =>
        current.map((product) =>
          Number(product.id) === Number(updated.id) ? updated : product,
        ),
      );
      toast.success("Product updated");
    } else {
      const created = await productService.create({
        ...payload,
        createdAt: new Date().toISOString(),
      });
      setProducts((current) => [created, ...current]);
      toast.success("Product created");
    }

    clearForm();
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setValue("name", product.name || "");
    setValue("price", product.price || 0);
    setValue("categoryId", product.categoryId || "");
    setValue("available", Boolean(product.available));
  };

  const deleteProduct = async (id) => {
    await productService.delete(id);
    setProducts((current) => current.filter((product) => Number(product.id) !== Number(id)));
    toast.success("Product deleted");
  };

  return (
    <div className="page-container space-y-6">
      <PageHeader title="Admin Products" description="Create, edit, and delete products." />

      <section className="card">
        <h2 className="card-title mb-4">{editingId ? "Edit product" : "Create product"}</h2>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <FormField
            label="Product name"
            placeholder="Enter product name"
            error={errors.name?.message}
            {...register("name")}
          />

          <FormField
            label="Price"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.price?.message}
            {...register("price")}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
            <select
              {...register("categoryId")}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId?.message && (
              <p className="mt-1 text-xs text-rose-600">{errors.categoryId.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Availability</label>
            <select
              {...register("available")}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="true">Available</option>
              <option value="false">Not Available</option>
            </select>
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {editingId ? "Update" : "Create"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={clearForm}
                className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      {loading ? (
        <Loader label="Loading products..." />
      ) : products.length === 0 ? (
        <EmptyState title="No products found" description="Create your first product." />
      ) : (
        <section className="card overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-3">Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Availability</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-slate-100">
                  <td className="py-3 font-medium text-slate-900">{product.name}</td>
                  <td className="py-3">{categoryMap[product.categoryId] || "-"}</td>
                  <td className="py-3">{formatCurrency(product.price)}</td>
                  <td className="py-3">{product.available ? "Available" : "Not Available"}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(product.id)}
                        className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
