import { useEffect, useMemo, useState } from "react";
import { createAppointment, getAppointments } from "../api/appointments";
import { getDoctors } from "../api/doctors";
import { getPatientById } from "../api/patients";
import ErrorAlert from "../components/ErrorAlert";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../context/AuthContext";
import { getAssignedDoctorId } from "../utils/assignments";
import { formatDateTime, getErrorMessage } from "../utils/formatters";
import {
  getAppointmentIdsByPatient,
  getAppointmentLink,
  setAppointmentLink
} from "../utils/recordLinks";

const initialAppointmentForm = {
  doctorId: "",
  visitDate: "",
  visitClock: ""
};

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

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const patientId = user?.id ? String(user.id) : "";
  const assignedDoctorId = getAssignedDoctorId(patientId);

  const [patient, setPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointmentForm, setAppointmentForm] = useState(initialAppointmentForm);

  const [loading, setLoading] = useState(true);
  const [submittingAppointment, setSubmittingAppointment] = useState(false);
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

  const loadAppointmentData = async () => {
    if (!patientId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [patientData, doctorsData, appointmentsData] = await Promise.all([
        getPatientById(patientId),
        getDoctors(),
        getAppointments()
      ]);

      const normalizedDoctors = toArray(doctorsData);
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
      setDoctors(normalizedDoctors);
      setAppointmentForm((prev) => ({
        ...prev,
        doctorId:
          prev.doctorId ||
          assignedDoctorId ||
          (normalizedDoctors[0] ? String(getDoctorId(normalizedDoctors[0])) : "")
      }));
    } catch (apiError) {
      const message = getErrorMessage(apiError, "Unable to load appointments.");
      setError(message);
      showToast({ title: "Load Failed", message, variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointmentData();
  }, [patientId]);

  const handleAppointmentInput = (event) => {
    const { name, value } = event.target;
    setAppointmentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleScheduleAppointment = async (event) => {
    event.preventDefault();
    setError("");

    if (!appointmentForm.doctorId) {
      setError("Please select a doctor.");
      return;
    }

    if (!appointmentForm.visitDate || !appointmentForm.visitClock) {
      setError("Appointment date and time are required.");
      return;
    }

    setSubmittingAppointment(true);
    const composedVisitTime = `${appointmentForm.visitDate}T${appointmentForm.visitClock}:00`;

    const payload = {
      visitTime: composedVisitTime,
      status: "Scheduled",
      patient: { id: Number(patientId) },
      doctor: { id: Number(appointmentForm.doctorId) }
    };

    try {
      const createdAppointment = await createAppointment(payload);
      const appointmentId = getAppointmentId(createdAppointment);
      if (appointmentId) {
        setAppointmentLink(appointmentId, patientId, appointmentForm.doctorId);
      }
      showToast({
        title: "Appointment Scheduled",
        message: "Appointment request created successfully.",
        variant: "success"
      });
      setAppointmentForm((prev) => ({
        ...prev,
        visitDate: "",
        visitClock: ""
      }));
      await loadAppointmentData();
    } catch (apiError) {
      const message = getErrorMessage(apiError, "Unable to schedule appointment.");
      setError(message);
      showToast({ title: "Schedule Failed", message, variant: "danger" });
    } finally {
      setSubmittingAppointment(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="h4 mb-1">My Appointments</h1>
          <p className="text-secondary mb-0">Schedule and review your appointments.</p>
        </div>
        <button type="button" className="btn btn-outline-primary" onClick={loadAppointmentData}>
          Refresh Data
        </button>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError("")} />

      {loading ? (
        <LoadingSpinner message="Loading appointments..." />
      ) : (
        <>
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h5 mb-3">Schedule Appointment</h2>

              <form onSubmit={handleScheduleAppointment} noValidate>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label htmlFor="doctorId" className="form-label fw-semibold">
                      Doctor
                    </label>
                    <select
                      id="doctorId"
                      name="doctorId"
                      className="form-select"
                      value={appointmentForm.doctorId}
                      onChange={handleAppointmentInput}
                    >
                      <option value="">Select doctor</option>
                      {doctors.map((doctor) => {
                        const doctorId = getDoctorId(doctor);
                        return (
                          <option key={doctorId} value={doctorId}>
                            {doctorId} - {getDoctorName(doctor)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="visitDate" className="form-label fw-semibold">
                      Visit Date
                    </label>
                    <input
                      id="visitDate"
                      name="visitDate"
                      type="date"
                      className="form-control"
                      value={appointmentForm.visitDate}
                      onChange={handleAppointmentInput}
                    />
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="visitClock" className="form-label fw-semibold">
                      Visit Time
                    </label>
                    <input
                      id="visitClock"
                      name="visitClock"
                      type="time"
                      className="form-control"
                      value={appointmentForm.visitClock}
                      onChange={handleAppointmentInput}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary mt-3" disabled={submittingAppointment}>
                  {submittingAppointment ? "Scheduling..." : "Schedule Appointment"}
                </button>
              </form>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h5 mb-3">Appointment History</h2>

              {patientAppointments.length === 0 ? (
                <p className="text-secondary mb-0">No appointments scheduled.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Date/Time</th>
                        <th>Status</th>
                        <th>Doctor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientAppointments.map((appointment) => (
                        <tr key={appointment?.id ?? appointment?.appointmentId}>
                          <td>{appointment?.id ?? "-"}</td>
                          <td>{formatDateTime(appointment?.visitTime || appointment?.appointmentDate)}</td>
                          <td>{appointment?.status || "-"}</td>
                          <td>
                            {doctorMap.get(
                              String(
                                appointment?.doctor?.id ??
                                  appointment?.doctorId ??
                                  getAppointmentLink(getAppointmentId(appointment))?.doctorId ??
                                  ""
                              )
                            ) || "-"}
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
