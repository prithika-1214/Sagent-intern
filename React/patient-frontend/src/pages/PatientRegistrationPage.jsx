import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDoctors } from "../api/doctors";
import { createPatient, getPatientById, updatePatient } from "../api/patients";
import ErrorAlert from "../components/ErrorAlert";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/formatters";
import { getAssignedDoctorId, setAssignedDoctorId } from "../utils/assignments";

const initialForm = {
  name: "",
  age: "",
  contactDetails: "",
  doctorId: ""
};

function toArray(data) {
  return Array.isArray(data) ? data : [];
}

function getPatientId(patient) {
  return patient?.id ?? patient?.patientId;
}

function getPatientName(patient) {
  return patient?.name ?? patient?.fullName ?? "";
}

function getPatientContact(patient) {
  return patient?.contactDetails ?? patient?.contact ?? patient?.phone ?? "";
}

function getDoctorId(doctor) {
  return doctor?.id ?? doctor?.doctorId;
}

function getDoctorName(doctor) {
  return doctor?.name ?? doctor?.fullName ?? doctor?.doctorName ?? "";
}

function validate(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!form.age || Number.isNaN(Number(form.age))) {
    errors.age = "Age must be a valid number.";
  } else if (Number(form.age) <= 0 || Number(form.age) > 120) {
    errors.age = "Age must be between 1 and 120.";
  }

  if (!form.contactDetails.trim()) {
    errors.contactDetails = "Contact details are required.";
  }

  if (!form.doctorId) {
    errors.doctorId = "Please select a doctor.";
  }

  return errors;
}

export default function PatientRegistrationPage() {
  const { showToast } = useToast();
  const { isAuthenticated, role, user } = useAuth();

  const isPublicRegistration = !isAuthenticated;
  const isMyProfileMode = isAuthenticated && role === "patient";

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [patientId, setPatientId] = useState(isMyProfileMode ? String(user?.id || "") : "");
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  const doctorOptions = useMemo(
    () =>
      doctors.map((doctor) => ({
        id: String(getDoctorId(doctor)),
        name: getDoctorName(doctor)
      })),
    [doctors]
  );

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const doctorsData = await getDoctors();
      const normalizedDoctors = toArray(doctorsData);
      setDoctors(normalizedDoctors);

      if (isMyProfileMode && user?.id) {
        const patient = await getPatientById(user.id);
        const resolvedPatientId = String(getPatientId(patient) || user.id);
        const assignedDoctorId = getAssignedDoctorId(resolvedPatientId);

        setPatientId(resolvedPatientId);
        setForm({
          name: getPatientName(patient),
          age: String(patient?.age ?? ""),
          contactDetails: getPatientContact(patient),
          doctorId: assignedDoctorId || (normalizedDoctors[0] ? String(getDoctorId(normalizedDoctors[0])) : "")
        });
      } else {
        setForm((prev) => ({
          ...prev,
          doctorId: prev.doctorId || (normalizedDoctors[0] ? String(getDoctorId(normalizedDoctors[0])) : "")
        }));
      }
    } catch (apiError) {
      setError(getErrorMessage(apiError, "Unable to load registration data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isMyProfileMode, user?.id]);

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
      age: Number(form.age),
      contact: form.contactDetails.trim(),
      contactDetails: form.contactDetails.trim()
    };

    try {
      if (isMyProfileMode && patientId) {
        await updatePatient(patientId, payload);
        setAssignedDoctorId(patientId, form.doctorId);

        showToast({
          title: "Profile Updated",
          message: "Your profile has been updated.",
          variant: "success"
        });
      } else {
        const createdPatient = await createPatient(payload);
        const createdPatientId = getPatientId(createdPatient);

        if (createdPatientId) {
          setAssignedDoctorId(createdPatientId, form.doctorId);
        }

        const createdIdLabel = createdPatientId ? ` Your Patient ID is ${createdPatientId}.` : "";
        const message = `Registration completed.${createdIdLabel}`;

        showToast({
          title: "Patient Registered",
          message,
          variant: "success"
        });

        setSuccessMessage(message);
        setForm({
          ...initialForm,
          doctorId: doctorOptions[0]?.id || ""
        });
      }
    } catch (apiError) {
      const message = getErrorMessage(apiError, "Unable to save patient profile.");
      setError(message);
      showToast({
        title: "Request Failed",
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
          <h1 className="h4 mb-1">{isMyProfileMode ? "My Profile" : "Patient Registration"}</h1>
          <p className="text-secondary mb-0">
            {isMyProfileMode
              ? "Update your profile and assigned doctor."
              : "Register your profile and choose your doctor."}
          </p>
        </div>
        {isPublicRegistration ? (
          <Link to="/login" className="btn btn-outline-primary">
            Back to Login
          </Link>
        ) : null}
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-4">
          {loading ? <LoadingSpinner message="Loading form..." /> : null}

          {!loading ? (
            <>
              <ErrorAlert message={error} onDismiss={() => setError("")} />

              {successMessage ? <div className="alert alert-success">{successMessage}</div> : null}

              {doctorOptions.length === 0 ? (
                <div className="alert alert-warning mb-0">
                  No doctors available. Please contact support.
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  {isMyProfileMode ? (
                    <div className="mb-3">
                      <label htmlFor="patientId" className="form-label fw-semibold">
                        Patient ID
                      </label>
                      <input id="patientId" type="text" className="form-control" value={patientId} disabled />
                    </div>
                  ) : null}

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
                    <label htmlFor="age" className="form-label fw-semibold">
                      Age
                    </label>
                    <input
                      id="age"
                      name="age"
                      type="number"
                      min="1"
                      max="120"
                      className={`form-control ${formErrors.age ? "is-invalid" : ""}`}
                      value={form.age}
                      onChange={handleInputChange}
                    />
                    {formErrors.age ? <div className="invalid-feedback">{formErrors.age}</div> : null}
                  </div>

                  <div className="mb-3">
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

                  <div className="mb-4">
                    <label htmlFor="doctorId" className="form-label fw-semibold">
                      Select Doctor
                    </label>
                    <select
                      id="doctorId"
                      name="doctorId"
                      className={`form-select ${formErrors.doctorId ? "is-invalid" : ""}`}
                      value={form.doctorId}
                      onChange={handleInputChange}
                    >
                      <option value="">Choose doctor</option>
                      {doctorOptions.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.id} - {doctor.name || "Doctor"}
                        </option>
                      ))}
                    </select>
                    {formErrors.doctorId ? <div className="invalid-feedback">{formErrors.doctorId}</div> : null}
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting
                      ? "Saving..."
                      : isMyProfileMode
                        ? "Update Profile"
                        : "Register Patient"}
                  </button>
                </form>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
