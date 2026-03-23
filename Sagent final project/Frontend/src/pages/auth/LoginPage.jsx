import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormInput from '../../components/common/FormInput';
import { useToast } from '../../components/common/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import { getDefaultRouteForRole } from '../../utils/auth';

const LoginPage = () => {
  const toast = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formValues, setFormValues] = useState({
    email: '',
    password: ''
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
    if (!formValues.email) {
      nextErrors.email = 'Email is required';
    }
    if (!formValues.password) {
      nextErrors.password = 'Password is required';
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
      const user = await login({
        email: formValues.email,
        password: formValues.password
      });
      toast.success(`Welcome, ${user.name}`);
      const target = location.state?.from?.pathname || getDefaultRouteForRole(user.role);
      navigate(target, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Unable to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container section">
      <div className="auth-card">
        <h1>Login</h1>
        <p>Sign in with your existing account.</p>
        <form className="grid-form" onSubmit={handleSubmit}>
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
            label="Password"
            name="password"
            type="password"
            value={formValues.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            error={errors.password}
            disabled={loading}
          />
          <div className="auth-assist-link">
            <Link className="text-link" to="/forgot-password">
              Forgot Password?
            </Link>
          </div>
          <button type="submit" className="btn btn-primary full-width-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        <p className="auth-footnote">
          New user?{' '}
          <Link className="text-link" to="/register">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
};

export default LoginPage;
