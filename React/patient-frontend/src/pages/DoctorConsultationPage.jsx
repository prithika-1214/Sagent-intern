import { useEffect, useState } from "react";
import { deleteAppointment, getAppointments, updateAppointment } from "../api/appointments";
import { createFeedback, deleteFeedback, getFeedbackList } from "../api/feedback";
import { getDoctorById } from "../api/doctors";
import { getPatients } from "../api/patients";
import ErrorAlert from "../components/ErrorAlert";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../context/AuthContext";
import { formatDateTime, getErrorMessage } from "../utils/formatters";
import { getAppointmentIdsByDoctor, getAppointmentLink, removeAppointmentLink } from "../utils/recordLinks";

const initialFeedbackForm = {
  appointmentId: "",
  response: "",
  rating: ""
};

function toArray(data) {
  return Array.isArray(data) ? data : [];
}

function getPatientId(patient) {
  return patient?.id ?? patient?.patientId;
}

function getPatientName(patient) {
  return patient?.name || patient?.fullName || `Patient ${getPatientId(patient)}`;
}

function getAppointmentId(appointment) {
  return appointment?.id ?? appointment?.appointmentId;
}

function getFeedbackId(feedback) {
  return feedback?.id ?? feedback?.feedbackId;
}

export default function DoctorConsultationPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const doctorId = user?.id ? String(user.id) : "";

  const [appointments, setAppointments] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackForm, setFeedbackForm] = useState(initialFeedbackForm);
  const [statusByAppointmentId, setStatusByAppointmentId] = useState({});
  const [appointmentPatientMap, setAppointmentPatientMap] = useState(new Map());

  const [loading, setLoading] = useState(true);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [error, setError] = useState("");

  const loadConsultationData = async () => {
    if (!doctorId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [doctorData, feedbackData, patientsData, appointmentsData] = await Promise.all([
        getDoctorById(doctorId),
        getFeedbackList(),
        getPatients(),
        getAppointments()
      ]);

      const doctorAppointments = toArray(doctorData?.appointments);
      const linkedAppointmentIdSet = new Set(getAppointmentIdsByDoctor(doctorId));
      const linkedAppointments = toArray(appointmentsData).filter((appointment) =>
        linkedAppointmentIdSet.has(String(getAppointmentId(appointment)))
      );
      const appointmentById = new Map();
      doctorAppointments.forEach((appointment) => {
        appointmentById.set(String(getAppointmentId(appointment)), appointment);
      });
      linkedAppointments.forEach((appointment) => {
        appointmentById.set(String(getAppointmentId(appointment)), appointment);
      });
      const mergedAppointments = Array.from(appointmentById.values()).sort(
        (a, b) =>
          new Date(b?.visitTime || b?.appointmentDate || 0) - new Date(a?.visitTime || a?.appointmentDate || 0)
      );

      const patientsById = new Map();
      toArray(patientsData).forEach((patient) => {
        patientsById.set(String(getPatientId(patient)), {
          id: String(getPatientId(patient)),
          name: getPatientName(patient)
        });
      });

      const patientMap = new Map();

      toArray(patientsData).forEach((patient) => {
        toArray(patient?.appointments).forEach((appointment) => {
          patientMap.set(String(getAppointmentId(appointment)), {
            id: String(getPatientId(patient)),
            name: getPatientName(patient)
          });
        });
      });

      mergedAppointments.forEach((appointment) => {
        const appointmentId = String(getAppointmentId(appointment));
        if (patientMap.has(appointmentId)) {
          return;
        }

        const linked = getAppointmentLink(appointmentId);
        const directPatientId = appointment?.patient?.id ?? appointment?.patient?.patientId;
        const resolvedPatientId =
          directPatientId != null && directPatientId !== "" ? String(directPatientId) : linked?.patientId || "";

        if (!resolvedPatientId) {
          return;
        }

        const knownPatient = patientsById.get(String(resolvedPatientId));
        patientMap.set(appointmentId, {
          id: String(resolvedPatientId),
          name: knownPatient?.name || `Patient ${resolvedPatientId}`
        });
      });

      setAppointments(mergedAppointments);
      setAppointmentPatientMap(patientMap);

      const statuses = {};
      mergedAppointments.forEach((appointment) => {
        statuses[getAppointmentId(appointment)] = appointment?.status || "Scheduled";
      });
      setStatusByAppointmentId(statuses);

      const doctorAppointmentIdSet = new Set(
        mergedAppointments.map((appointment) => String(getAppointmentId(appointment)))
      );
      const filteredFeedback = toArray(feedbackData).filter((feedback) =>
        doctorAppointmentIdSet.has(String(feedback?.appointment?.id))
      );
      setFeedbackList(filteredFeedback);

      setFeedbackForm((prev) => ({
        ...prev,
        appointmentId:
          prev.appointmentId && doctorAppointmentIdSet.has(String(prev.appointmentId))
            ? prev.appointmentId
            : mergedAppointments[0]
              ? String(getAppointmentId(mergedAppointments[0]))
              : ""
      }));
    } catch (apiError) {
      const message = getErrorMessage(apiError, "Unable to load consultation data.");
      setError(message);
      showToast({ title: "Load Failed", message, variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultationData();
  }, [doctorId]);

  const handleUpdateAppointmentStatus = async (appointment) => {
    const appointmentId = getAppointmentId(appointment);
    const nextStatus = statusByAppointmentId[appointmentId] || appointment?.status || "Scheduled";
    const patientRef = appointmentPatientMap.get(String(appointmentId));
    const linked = getAppointmentLink(appointmentId);

    const payload = {
      visitTime: appointment?.visitTime || appointment?.appointmentDate || null,
      status: nextStatus
    };

    const resolvedPatientId = patientRef?.id || linked?.patientId;
    if (resolvedPatientId) {
      payload.patient = { id: Number(resolvedPatientId) };
    }

    if (doctorId) {
      payload.doctor = { id: Number(doctorId) };
    }

    try {
      await updateAppointment(appointmentId, payload);
      showToast({ title: "Status Updated", message: "Appointment status updated.", variant: "success" });
      await loadConsultationData();
    } catch (apiError) {
      const message = getErrorMessage(apiError, "Unable to update appointment status.");
      setError(message);
      showToast({ title: "Update Failed", message, variant: "danger" });
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm("Delete this appointment?")) {
      return;
    }

    try {
      await deleteAppointment(appointmentId);
      removeAppointmentLink(appointmentId);
      showToast({ title: "Appointment Deleted", message: "Appointment has been removed.", variant: "warning" });
      await loadConsultationData();
    } catch (apiError) {
      const message = getErrorMessage(apiError, "Unable to delete appointment.");
      setError(message);
      showToast({ title: "Delete Failed", message, variant: "danger" });
    }
  };

  const handleFeedbackInput = (event) => {
    const { name, value } = event.target;
    setFeedbackForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateFeedback = async (event) => {
    event.preventDefault();
    setError("");

    if (!feedbackForm.appointmentId) {
      setError("Select an appointment.");
      return;
    }

    if (!feedbackForm.response.trim()) {
      setError("Feedback response is required.");
      return;
    }

    setSavingFeedback(true);

    const payload = {
      response: feedbackForm.response.trim(),
      rating: feedbackForm.rating ? Number(feedbackForm.rating) : null,
      appointment: { id: Number(feedbackForm.appointmentId) }
    };

    try {
      await createFeedback(payload);
      showToast({ title: "Feedback Sent", message: "Feedback has been saved.", variant: "success" });
      setFeedbackForm((prev) => ({ ...initialFeedbackForm, appointmentId: prev.appointmentId }));
      await loadConsultationData();
    } catch (apiError) {
      const message = getErrorMessage(apiError, "Unable to send feedback.");
      setError(message);
      showToast({ title: "Send Failed", message, variant: "danger" });
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm("Delete this feedback?")) {
      return;
    }

    try {
      await deleteFeedback(feedbackId);
      showToast({ title: "Feedback Deleted", message: "Feedback has been removed.", variant: "warning" });
      await loadConsultationData();
    } catch (apiError) {
      const message = getErrorMessage(apiError, "Unable to delete feedback.");
      setError(message);
      showToast({ title: "Delete Failed", message, variant: "danger" });
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="h4 mb-1">Doctor Consultation</h1>
          <p className="text-secondary mb-0">Review patient appointments and send feedback.</p>
        </div>
        <button type="button" className="btn btn-outline-primary" onClick={loadConsultationData}>
          Refresh Data
        </button>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError("")} />

      {loading ? (
        <LoadingSpinner message="Loading appointments and feedback..." />
      ) : (
        <>
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h5 mb-3">Appointments (Scheduled by Patients)</h2>

              {appointments.length === 0 ? (
                <p className="text-secondary mb-0">No appointments available.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Patient</th>
                        <th>Date/Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appointment) => {
                        const id = getAppointmentId(appointment);
                        const patientRef = appointmentPatientMap.get(String(id));

                        return (
                          <tr key={id}>
                            <td>{id}</td>
                            <td>{patientRef?.name || "-"}</td>
                            <td>{formatDateTime(appointment?.visitTime || appointment?.appointmentDate)}</td>
                            <td>
                              <select
                                className="form-select form-select-sm"
                                value={statusByAppointmentId[id] || appointment?.status || "Scheduled"}
                                onChange={(event) =>
                                  setStatusByAppointmentId((prev) => ({ ...prev, [id]: event.target.value }))
                                }
                              >
                                <option value="Scheduled">Scheduled</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleUpdateAppointmentStatus(appointment)}
                                >
                                  Update
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteAppointment(id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h5 mb-3">Send Feedback</h2>

              {appointments.length === 0 ? (
                <p className="text-secondary mb-0">No appointments available for feedback.</p>
              ) : (
                <form onSubmit={handleCreateFeedback} noValidate>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label htmlFor="appointmentId" className="form-label fw-semibold">
                        Appointment
                      </label>
                      <select
                        id="appointmentId"
                        name="appointmentId"
                        className="form-select"
                        value={feedbackForm.appointmentId}
                        onChange={handleFeedbackInput}
                      >
                        <option value="">Select appointment</option>
                        {appointments.map((appointment) => {
                          const appointmentId = getAppointmentId(appointment);
                          return (
                            <option key={appointmentId} value={appointmentId}>
                              #{appointmentId} - {formatDateTime(appointment?.visitTime || appointment?.appointmentDate)}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="col-md-2">
                      <label htmlFor="rating" className="form-label fw-semibold">
                        Rating
                      </label>
                      <input
                        id="rating"
                        name="rating"
                        type="number"
                        min="1"
                        max="5"
                        className="form-control"
                        value={feedbackForm.rating}
                        onChange={handleFeedbackInput}
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="response" className="form-label fw-semibold">
                        Response
                      </label>
                      <input
                        id="response"
                        name="response"
                        type="text"
                        className="form-control"
                        value={feedbackForm.response}
                        onChange={handleFeedbackInput}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary mt-3" disabled={savingFeedback}>
                    {savingFeedback ? "Saving..." : "Send Feedback"}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h5 mb-3">Sent Feedback</h2>

              {feedbackList.length === 0 ? (
                <p className="text-secondary mb-0">No feedback messages available.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Appointment ID</th>
                        <th>Response</th>
                        <th>Rating</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbackList.map((feedback) => (
                        <tr key={getFeedbackId(feedback)}>
                          <td>{feedback?.id}</td>
                          <td>{feedback?.appointment?.id ?? "-"}</td>
                          <td>{feedback?.response || "-"}</td>
                          <td>{feedback?.rating ?? "-"}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteFeedback(getFeedbackId(feedback))}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
