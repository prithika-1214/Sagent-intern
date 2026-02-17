import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import FormField from "../../components/common/FormField";
import useAuth from "../../hooks/useAuth";
import { ROLES } from "../../utils/constants";

const schema = yup.object({
  contact: yup.string().trim().required("Contact is required"),
  name: yup.string().trim(),
  role: yup
    .string()
    .oneOf(Object.values(ROLES), "Select a valid role")
    .required("Role is required"),
});

const destinationByRole = {
  [ROLES.CUSTOMER]: "/products",
  [ROLES.STORE]: "/store",
  [ROLES.DELIVERY_AGENT]: "/delivery",
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      contact: "",
      name: "",
      role: ROLES.CUSTOMER,
    },
  });

  const onSubmit = async (values) => {
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name || "user"}`);
      navigate(destinationByRole[values.role] || "/");
    } catch (error) {
      toast.error(error?.message || "Login failed");
    }
  };

  return (
    <div className="page-container">
      <div className="mx-auto max-w-md">
        <div className="card">
          <h1 className="section-title text-center">Login</h1>
          <p className="mt-1 text-center text-sm text-slate-500">
            Uses `/users` controller data for authentication lookup.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormField
              label="Contact"
              placeholder="Phone or email"
              error={errors.contact?.message}
              {...register("contact")}
            />
            <FormField
              label="Name (optional)"
              placeholder="Optional exact name check"
              error={errors.name?.message}
              {...register("name")}
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
              <select
                {...register("role")}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              >
                <option value={ROLES.CUSTOMER}>Customer</option>
                <option value={ROLES.STORE}>Store</option>
                <option value={ROLES.DELIVERY_AGENT}>Delivery Agent</option>
              </select>
              {errors.role?.message && <p className="mt-1 text-xs text-rose-600">{errors.role.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            No account?{" "}
            <Link to="/auth/register" className="font-semibold text-brand-700 hover:text-brand-800">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
