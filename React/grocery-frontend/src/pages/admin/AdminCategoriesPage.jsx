import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import FormField from "../../components/common/FormField";
import categoryService from "../../services/categoryService";

const schema = yup.object({
  name: yup.string().trim().required("Category name is required"),
});

export default function AdminCategoriesPage() {
  const [loading, setLoading] = useState(true);
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
    },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clearForm = () => {
    setEditingId(null);
    reset({ name: "" });
  };

  const onSubmit = async (values) => {
    if (editingId) {
      const updated = await categoryService.update({
        id: editingId,
        name: values.name,
      });

      setCategories((current) =>
        current.map((category) =>
          Number(category.id) === Number(updated.id) ? updated : category,
        ),
      );
      toast.success("Category updated");
    } else {
      const created = await categoryService.create({ name: values.name });
      setCategories((current) => [created, ...current]);
      toast.success("Category created");
    }

    clearForm();
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setValue("name", category.name || "");
  };

  const deleteCategory = async (id) => {
    await categoryService.delete(id);
    setCategories((current) =>
      current.filter((category) => Number(category.id) !== Number(id)),
    );
    toast.success("Category deleted");
  };

  return (
    <div className="page-container space-y-6">
      <PageHeader title="Admin Categories" description="Create and maintain product categories." />

      <section className="card">
        <h2 className="card-title mb-4">{editingId ? "Edit category" : "Create category"}</h2>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField
            label="Category name"
            placeholder="Enter category name"
            error={errors.name?.message}
            {...register("name")}
          />

          <div className="flex items-center gap-2">
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
        <Loader label="Loading categories..." />
      ) : categories.length === 0 ? (
        <EmptyState title="No categories found" description="Create your first category." />
      ) : (
        <section className="card overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-3">Category</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-slate-100">
                  <td className="py-3 font-medium text-slate-900">{category.name}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCategory(category.id)}
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
