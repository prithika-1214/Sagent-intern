import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import FormField from "../../components/common/FormField";
import useAuth from "../../hooks/useAuth";
import { ROLES } from "../../utils/constants";

const schema = yup.object({
  name: yup.string().trim().min(2, "Name must be at least 2 characters").required("Name is required"),
  contact: yup
    .string()
    .trim()
    .min(8, "Contact should be at least 8 characters")
    .required("Contact is required"),
  role: yup
    .string()
    .oneOf(Object.values(ROLES), "Select a valid role")
    .required("Role is required"),
  address: yup.string().when("role", {
    is: ROLES.CUSTOMER,
    then: (rule) =>
      rule.trim().min(5, "Address should be at least 5 characters").required("Address is required"),
    otherwise: (rule) => rule.optional(),
  }),
  location: yup.string().when("role", {
    is: ROLES.STORE,
    then: (rule) =>
      rule
        .trim()
        .min(3, "Location should be at least 3 characters")
        .required("Store location is required"),
    otherwise: (rule) => rule.optional(),
  }),
  vehicleNo: yup.string().when("role", {
    is: ROLES.DELIVERY_AGENT,
    then: (rule) =>
      rule
        .trim()
        .min(4, "Vehicle number should be at least 4 characters")
        .required("Vehicle number is required"),
    otherwise: (rule) => rule.optional(),
  }),
});

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      contact: "",
      address: "",
      location: "",
      vehicleNo: "",
      role: ROLES.CUSTOMER,
    },
  });
  const selectedRole = watch("role");
  const roleDescription =
    selectedRole === ROLES.STORE
      ? "Register a store account"
      : selectedRole === ROLES.DELIVERY_AGENT
        ? "Register a delivery agent account"
        : "Register as a customer account";

  const onSubmit = async (values) => {
    try {
      await registerUser(values);
      toast.success("Registration successful. Please login.");
      navigate("/auth/login");
    } catch (error) {
      toast.error(error?.message || "Registration failed");
    }
  };

  return (
    <div className="page-container">
      <div className="mx-auto max-w-md">
        <div className="card">
          <h1 className="section-title text-center">Create Account</h1>
          <p className="mt-1 text-center text-sm text-slate-500">{roleDescription}</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormField
              label="Name"
              placeholder="John Doe"
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

            <FormField
              label={selectedRole === ROLES.DELIVERY_AGENT ? "Phone" : "Contact"}
              placeholder={selectedRole === ROLES.DELIVERY_AGENT ? "Phone number" : "Phone or email"}
              error={errors.contact?.message}
              {...register("contact")}
            />

            {selectedRole === ROLES.CUSTOMER && (
              <FormField
                label="Address"
                placeholder="Enter delivery address"
                error={errors.address?.message}
                {...register("address")}
              />
            )}

            {selectedRole === ROLES.STORE && (
              <FormField
                label="Store Location"
                placeholder="Enter store location"
                error={errors.location?.message}
                {...register("location")}
              />
            )}

            {selectedRole === ROLES.DELIVERY_AGENT && (
              <FormField
                label="Vehicle Number"
                placeholder="Enter vehicle number"
                error={errors.vehicleNo?.message}
                {...register("vehicleNo")}
              />
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/auth/login" className="font-semibold text-brand-700 hover:text-brand-800">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
