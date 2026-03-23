import { useEffect, useMemo, useState } from "react";
import { getAppointments } from "../api/appointments";
import { getDoctors } from "../api/doctors";
import { getFeedbackList } from "../api/feedback";
import { getPatientById } from "../api/patients";
import ErrorAlert from "../components/ErrorAlert";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../context/AuthContext";
import { formatDateTime, getErrorMessage } from "../utils/formatters";
import { getAppointmentIdsByPatient, getAppointmentLink } from "../utils/recordLinks";

function toArray(data) {
  return Array.isArray(data) ? data : [];
}

function getDoctorId(doctor) {
  return doctor?.id ?? doctor?.doctorId;
}

function getDoctorName(doctor) {
  return doctor?.name ?? doctor?.fullName ?? doctor?.doctorName ?? "";
}

function getAppointmentId(appointment) {
  return appointment?.id ?? appointment?.appointmentId;
}

export default function PatientFeedbackPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const patientId = user?.id ? String(user.id) : "";

  const [patient, setPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const doctorMap = useMemo(() => {
    const map = new Map();
    doctors.forEach((doctor) => {
      map.set(String(getDoctorId(doctor)), getDoctorName(doctor));
    });
    return map;
  }, [doctors]);

  const patientAppointments = useMemo(
    () =>
      toArray(patient?.appointments).sort(
        (a, b) =>
          new Date(b?.visitTime || b?.appointmentDate || 0) - new Date(a?.visitTime || a?.appointmentDate || 0)
      ),
    [patient?.appointments]
  );

  const appointmentMap = useMemo(() => {
    const map = new Map();
    patientAppointments.forEach((appointment) => {
      map.set(String(getAppointmentId(appointment)), appointment);
    });
    return map;
  }, [patientAppointments]);

  const appointmentIdSet = useMemo(
    () => new Set(patientAppointments.map((appointment) => String(getAppointmentId(appointment)))),
    [patientAppointments]
  );

  const patientFeedback = useMemo(
    () =>
      feedbackList
        .filter((feedback) => {
          const appointmentId = feedback?.appointment?.id;
          return appointmentId != null && appointmentIdSet.has(String(appointmentId));
        })
        .sort((a, b) => (b?.id ?? 0) - (a?.id ?? 0)),
    [appointmentIdSet, feedbackList]
  );

  const loadFeedbackData = async () => {
    if (!patientId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [patientData, feedbackData, doctorsData, appointmentsData] = await Promise.all([
        getPatientById(patientId),
        getFeedbackList(),
        getDoctors(),
        getAppointments()
      ]);

      const linkedAppointmentIdSet = new Set(getAppointmentIdsByPatient(patientId));
      const linkedAppointments = toArray(appointmentsData).filter((appointment) =>
        linkedAppointmentIdSet.has(String(getAppointmentId(appointment)))
      );
      const appointmentById = new Map();

      toArray(patientData?.appointments).forEach((appointment) => {
        appointmentById.set(String(getAppointmentId(appointment)), appointment);
      });
      linkedAppointments.forEach((appointment) => {
        appointmentById.set(String(getAppointmentId(appointment)), appointment);
      });

      setPatient({
        ...patientData,
        appointments: Array.from(appointmentById.values())
      });
      setFeedbackList(toArray(feedbackData));
      setDoctors(toArray(doctorsData));
    } catch (apiError) {
      const message = getErrorMessage(apiError, "Unable to load feedback.");
      setError(message);
      showToast({ title: "Load Failed", message, variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbackData();
  }, [patientId]);

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="h4 mb-1">My Feedback</h1>
          <p className="text-secondary mb-0">View feedback shared by your doctor.</p>
        </div>
        <button type="button" className="btn btn-outline-primary" onClick={loadFeedbackData}>
          Refresh Data
        </button>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError("")} />

      {loading ? (
        <LoadingSpinner message="Loading feedback..." />
      ) : (
        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="h5 mb-3">Doctor Feedback</h2>

            {patientFeedback.length === 0 ? (
              <p className="text-secondary mb-0">No feedback messages available yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Feedback ID</th>
                      <th>Appointment ID</th>
                      <th>Appointment Date/Time</th>
                      <th>Doctor</th>
                      <th>Response</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientFeedback.map((feedback) => {
                      const appointmentId = String(feedback?.appointment?.id ?? "");
                      const appointment = appointmentMap.get(appointmentId);
                      const doctorId =
                        appointment?.doctor?.id ??
                        appointment?.doctorId ??
                        getAppointmentLink(getAppointmentId(appointment))?.doctorId;

                      return (
                        <tr key={feedback?.id ?? feedback?.feedbackId}>
                          <td>{feedback?.id ?? "-"}</td>
                          <td>{feedback?.appointment?.id ?? "-"}</td>
                          <td>{formatDateTime(appointment?.visitTime || appointment?.appointmentDate)}</td>
                          <td>{doctorMap.get(String(doctorId ?? "")) || "-"}</td>
                          <td>{feedback?.response || "-"}</td>
                          <td>{feedback?.rating ?? "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
