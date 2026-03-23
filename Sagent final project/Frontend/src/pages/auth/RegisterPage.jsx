import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormInput from '../../components/common/FormInput';
import SelectInput from '../../components/common/SelectInput';
import { createUser } from '../../api/usersApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/ToastProvider';
import { getDefaultRouteForRole, USER_ROLES } from '../../utils/auth';

const roleOptions = [
  { value: USER_ROLES.USER, label: USER_ROLES.USER },
  { value: USER_ROLES.ADMIN, label: USER_ROLES.ADMIN }
];

const RegisterPage = () => {
  const toast = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({
    userName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.USER
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!formValues.userName.trim()) {
      nextErrors.userName = 'Name is required';
    }
    if (!formValues.email.trim()) {
      nextErrors.email = 'Email is required';
    }
    if (!formValues.mobileNumber.trim()) {
      nextErrors.mobileNumber = 'Mobile number is required';
    }
    if (!formValues.password) {
      nextErrors.password = 'Password is required';
    }
    if (formValues.password !== formValues.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formValues.role) {
      nextErrors.role = 'Role is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      await createUser({
        userName: formValues.userName,
        email: formValues.email,
        mobileNumber: formValues.mobileNumber,
        password: formValues.password,
        role: formValues.role,
        accountStatus: 'ACTIVE'
      });

      const user = await login({
        email: formValues.email,
        password: formValues.password
      });

      toast.success('Account created successfully');
      navigate(getDefaultRouteForRole(user.role), { replace: true });
    } catch (error) {
      toast.error(error.message || 'Unable to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container section">
      <div className="auth-card">
        <h1>Register</h1>
        <p>Create a new account with role access.</p>
        <form className="grid-form" onSubmit={handleSubmit}>
          <FormInput
            label="Full Name"
            name="userName"
            value={formValues.userName}
            onChange={handleChange}
            placeholder="Enter your name"
            required
            error={errors.userName}
            disabled={loading}
          />
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formValues.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
            error={errors.email}
            disabled={loading}
          />
          <FormInput
            label="Mobile Number"
            name="mobileNumber"
            value={formValues.mobileNumber}
            onChange={handleChange}
            placeholder="Enter mobile number"
            required
            error={errors.mobileNumber}
            disabled={loading}
          />
          <SelectInput
            label="Role"
            name="role"
            value={formValues.role}
            onChange={handleChange}
            options={roleOptions}
            required
            error={errors.role}
            disabled={loading}
          />
          <FormInput
            label="Password"
            name="password"
            type="password"
            value={formValues.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
            error={errors.password}
            disabled={loading}
          />
          <FormInput
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formValues.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter password"
            required
            error={errors.confirmPassword}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary full-width-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="auth-footnote">
          Already have an account?{' '}
          <Link className="text-link" to="/login">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
};

export default RegisterPage;
