import { useState } from "react";
import { Link } from "react-router-dom";
import { createDoctor } from "../api/doctors";
import ErrorAlert from "../components/ErrorAlert";
import { useToast } from "../components/ToastProvider";
import { getErrorMessage } from "../utils/formatters";

const initialForm = {
  name: "",
  specialization: "",
  contactDetails: ""
};

function getDoctorId(doctor) {
  return doctor?.id ?? doctor?.doctorId ?? "";
}

function validate(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!form.specialization.trim()) {
    errors.specialization = "Specialization is required.";
  }

  if (!form.contactDetails.trim()) {
    errors.contactDetails = "Contact details are required.";
  }

  return errors;
}

export default function DoctorRegistrationPage() {
  const { showToast } = useToast();

  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      specialization: form.specialization.trim(),
      contact: form.contactDetails.trim(),
      contactDetails: form.contactDetails.trim()
    };

    try {
      const createdDoctor = await createDoctor(payload);
      const createdDoctorId = getDoctorId(createdDoctor);
      const idMessage = createdDoctorId ? ` Your Doctor ID is ${createdDoctorId}.` : "";
      const message = `Doctor registration completed.${idMessage}`;

      showToast({
        title: "Doctor Registered",
        message,
        variant: "success"
      });

      setSuccessMessage(message);
      setForm(initialForm);
      setFormErrors({});
    } catch (apiError) {
      const message = getErrorMessage(apiError, "Unable to register doctor.");
      setError(message);
      showToast({
        title: "Registration Failed",
        message,
        variant: "danger"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 mb-1">Doctor Registration</h1>
          <p className="text-secondary mb-0">Register doctor profile and use generated ID for login.</p>
        </div>
        <Link to="/login" className="btn btn-outline-primary">
          Back to Login
        </Link>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-4">
          <ErrorAlert message={error} onDismiss={() => setError("")} />
          {successMessage ? <div className="alert alert-success">{successMessage}</div> : null}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="name" className="form-label fw-semibold">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={`form-control ${formErrors.name ? "is-invalid" : ""}`}
                value={form.name}
                onChange={handleInputChange}
              />
              {formErrors.name ? <div className="invalid-feedback">{formErrors.name}</div> : null}
            </div>

            <div className="mb-3">
              <label htmlFor="specialization" className="form-label fw-semibold">
                Specialization
              </label>
              <input
                id="specialization"
                name="specialization"
                type="text"
                className={`form-control ${formErrors.specialization ? "is-invalid" : ""}`}
                value={form.specialization}
                onChange={handleInputChange}
              />
              {formErrors.specialization ? (
                <div className="invalid-feedback">{formErrors.specialization}</div>
              ) : null}
            </div>

            <div className="mb-4">
              <label htmlFor="contactDetails" className="form-label fw-semibold">
                Contact Details
              </label>
              <textarea
                id="contactDetails"
                name="contactDetails"
                rows="3"
                className={`form-control ${formErrors.contactDetails ? "is-invalid" : ""}`}
                value={form.contactDetails}
                onChange={handleInputChange}
              />
              {formErrors.contactDetails ? (
                <div className="invalid-feedback">{formErrors.contactDetails}</div>
              ) : null}
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Registering..." : "Register Doctor"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
