import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormInput from '../../components/common/FormInput';
import { useToast } from '../../components/common/ToastProvider';
import { resetPasswordWithOtp, sendPasswordResetOtp, verifyPasswordResetOtp } from '../../api/authApi';

const ForgotPasswordPage = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({
    mobileNumber: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const isBusy = sendLoading || verifyLoading || resetLoading;

  const validateMobileNumber = () => {
    const nextErrors = {};
    const digits = String(formValues.mobileNumber || '').replace(/\D/g, '');
    if (!digits) {
      nextErrors.mobileNumber = 'Mobile number is required';
    } else if (digits.length < 10) {
      nextErrors.mobileNumber = 'Enter a valid mobile number';
    }
    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));

    if (name === 'mobileNumber') {
      setOtpSent(false);
      setOtpVerified(false);
    }

    if (name === 'otp') {
      setOtpVerified(false);
    }
  };

  const handleSendOtp = async () => {
    const nextErrors = validateMobileNumber();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setSendLoading(true);
      await sendPasswordResetOtp({ mobileNumber: formValues.mobileNumber });
      setOtpSent(true);
      setOtpVerified(false);
      setFormValues((current) => ({ ...current, otp: '' }));
      toast.success('OTP sent to your mobile number');
    } catch (error) {
      toast.error(error.message || 'Unable to send OTP');
    } finally {
      setSendLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const nextErrors = {
      ...validateMobileNumber()
    };

    if (!String(formValues.otp || '').trim()) {
      nextErrors.otp = 'OTP is required';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setVerifyLoading(true);
      await verifyPasswordResetOtp({
        mobileNumber: formValues.mobileNumber,
        otp: formValues.otp
      });
      setOtpVerified(true);
      toast.success('OTP verified successfully');
    } catch (error) {
      setOtpVerified(false);
      toast.error(error.message || 'Unable to verify OTP');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {
      ...validateMobileNumber()
    };

    if (!String(formValues.otp || '').trim()) {
      nextErrors.otp = 'OTP is required';
    }
    if (!formValues.newPassword) {
      nextErrors.newPassword = 'New password is required';
    } else if (String(formValues.newPassword).length < 6) {
      nextErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (!formValues.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm the new password';
    } else if (formValues.newPassword !== formValues.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }
    if (!otpVerified) {
      nextErrors.otp = nextErrors.otp || 'Verify the OTP before resetting the password';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setResetLoading(true);
      await resetPasswordWithOtp(formValues);
      toast.success('Password updated successfully. Please login.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Unable to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <section className="container section">
      <div className="auth-card">
        <h1>Forgot Password</h1>
        <p>Use SMS OTP on your registered mobile number to set a new password.</p>
        <form className="grid-form" onSubmit={handleSubmit}>
          <FormInput
            label="Mobile Number"
            name="mobileNumber"
            value={formValues.mobileNumber}
            onChange={handleChange}
            placeholder="Enter your registered mobile number"
            required
            error={errors.mobileNumber}
            disabled={isBusy}
          />
          <div className="auth-action-row">
            <button type="button" className="btn btn-outline full-width-btn" onClick={handleSendOtp} disabled={isBusy}>
              {sendLoading ? 'Sending OTP...' : otpSent ? 'Resend OTP' : 'Send OTP'}
            </button>
          </div>

          <FormInput
            label="OTP"
            name="otp"
            value={formValues.otp}
            onChange={handleChange}
            placeholder="Enter the SMS OTP"
            required
            error={errors.otp}
            disabled={!otpSent || resetLoading}
          />
          <div className="auth-action-row">
            <button
              type="button"
              className="btn btn-outline full-width-btn"
              onClick={handleVerifyOtp}
              disabled={!otpSent || verifyLoading || resetLoading}
            >
              {verifyLoading ? 'Verifying OTP...' : otpVerified ? 'OTP Verified' : 'Verify OTP'}
            </button>
          </div>

          <FormInput
            label="New Password"
            name="newPassword"
            type="password"
            value={formValues.newPassword}
            onChange={handleChange}
            placeholder="Enter your new password"
            required
            error={errors.newPassword}
            disabled={!otpSent || resetLoading}
          />
          <FormInput
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={formValues.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter the new password"
            required
            error={errors.confirmPassword}
            disabled={!otpSent || resetLoading}
          />

          <button type="submit" className="btn btn-primary full-width-btn" disabled={!otpVerified || resetLoading}>
            {resetLoading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>
        <p className="auth-footnote">
          Remembered it?{' '}
          <Link className="text-link" to="/login">
            Back to login
          </Link>
        </p>
      </div>
    </section>
  );
};

export default ForgotPasswordPage;
