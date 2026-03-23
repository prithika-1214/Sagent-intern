import { useEffect, useMemo, useState } from "react";
import { getPatients } from "../api/patients";
import { getVitals } from "../api/vitals";
import ErrorAlert from "../components/ErrorAlert";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../context/AuthContext";
import { getAssignedPatientIds } from "../utils/assignments";
import { formatDateTime, getErrorMessage } from "../utils/formatters";

function toArray(data) {
  return Array.isArray(data) ? data : [];
}

function getPatientId(patient) {
  return patient?.id ?? patient?.patientId;
}

function getPatientName(patient) {
  return patient?.name || patient?.fullName || `Patient ${getPatientId(patient)}`;
}

function calculateAverage(values) {
  if (values.length === 0) {
    return "-";
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return (total / values.length).toFixed(1);
}

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [patients, setPatients] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const doctorId = user?.id ? String(user.id) : "";

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const assignedPatientIdSet = new Set(getAssignedPatientIds(doctorId));

      const [patientsData, vitalsData] = await Promise.all([getPatients(), getVitals()]);

      const normalizedPatients = toArray(patientsData).filter((patient) =>
        assignedPatientIdSet.has(String(getPatientId(patient)))
      );
      const visibleVitals = toArray(vitalsData).filter((entry) => {
        const vitalPatientId = entry?.patient?.id ?? entry?.patient?.patientId;
        return assignedPatientIdSet.has(String(vitalPatientId));
      });
      const visibleHistory = normalizedPatients.flatMap((patient) =>
        toArray(patient?.medicalHistories).map((history) => ({
          ...history,
          patient: { id: getPatientId(patient) }
        }))
      );

      setPatients(normalizedPatients);
      setVitals(visibleVitals);
      setMedicalHistory(visibleHistory);

      setSelectedPatientId((prev) => {
        if (prev) {
          return prev;
        }

        const firstPatientId = getPatientId(normalizedPatients[0]);
        return firstPatientId ? String(firstPatientId) : "";
      });
    } catch (apiError) {
      const message = getErrorMessage(apiError, "Unable to load dashboard data.");
      setError(message);
      showToast({ title: "Load Failed", message, variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [doctorId]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => String(getPatientId(patient)) === String(selectedPatientId)),
    [patients, selectedPatientId]
  );

  const selectedVitals = useMemo(() => {
    const filtered = selectedPatientId
      ? vitals.filter((entry) => String(entry?.patient?.id ?? entry?.patient?.patientId ?? "") === String(selectedPatientId))
      : vitals;

    return filtered.sort((a, b) => new Date(b?.recordedTime || b?.date || 0) - new Date(a?.recordedTime || a?.date || 0));
  }, [selectedPatientId, vitals]);

  const selectedHistory = useMemo(() => {
    const filtered = selectedPatientId
      ? medicalHistory.filter(
          (entry) => String(entry?.patient?.id ?? entry?.patient?.patientId ?? "") === String(selectedPatientId)
        )
      : medicalHistory;

    return filtered.sort((a, b) => new Date(b?.recordTime || b?.date || 0) - new Date(a?.recordTime || a?.date || 0));
  }, [medicalHistory, selectedPatientId]);

  const trendSummary = useMemo(() => {
    const heartRates = selectedVitals
      .map((item) => Number(item?.heartRate))
      .filter((value) => Number.isFinite(value));

    const oxygenLevels = selectedVitals
      .map((item) => Number(item?.oxygenLevel))
      .filter((value) => Number.isFinite(value));

    const temperatures = selectedVitals
      .map((item) => Number(item?.temperature))
      .filter((value) => Number.isFinite(value));

    return {
      heartRate: calculateAverage(heartRates),
      oxygenLevel: calculateAverage(oxygenLevels),
      temperature: calculateAverage(temperatures)
    };
  }, [selectedVitals]);

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="h4 mb-1">Doctor Dashboard</h1>
          <p className="text-secondary mb-0">Monitor patients, review records, and analyze vitals trends.</p>
        </div>
        <button type="button" className="btn btn-outline-primary" onClick={loadDashboard}>
          Refresh Dashboard
        </button>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError("")} />

      {loading ? (
        <LoadingSpinner message="Loading dashboard data..." />
      ) : (
        <div className="row g-4">
          <div className="col-xl-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h2 className="h5 mb-3">Patients</h2>

                {patients.length === 0 ? (
                  <p className="text-secondary mb-0">No patients are assigned to you yet.</p>
                ) : (
                  <div className="list-group">
                    {patients.map((patient) => {
                      const id = getPatientId(patient);
                      const isActive = String(id) === String(selectedPatientId);

                      return (
                        <button
                          key={id}
                          type="button"
                          className={`list-group-item list-group-item-action ${isActive ? "active" : ""}`}
                          onClick={() => setSelectedPatientId(String(id))}
                        >
                          <div className="d-flex justify-content-between">
                            <span>{getPatientName(patient)}</span>
                            <small>ID: {id}</small>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-xl-8">
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h2 className="h5 mb-3">Selected Patient</h2>

                {selectedPatient ? (
                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="metric-card p-3 border rounded bg-light">
                        <div className="small text-secondary">Name</div>
                        <div className="fw-semibold">{getPatientName(selectedPatient)}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="metric-card p-3 border rounded bg-light">
                        <div className="small text-secondary">Age</div>
                        <div className="fw-semibold">{selectedPatient?.age ?? "-"}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="metric-card p-3 border rounded bg-light">
                        <div className="small text-secondary">Contact</div>
                        <div className="fw-semibold">{selectedPatient?.contactDetails || selectedPatient?.contact || "-"}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-secondary mb-0">Select a patient to view records.</p>
                )}
              </div>
            </div>

            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h2 className="h5 mb-3">Trend Review</h2>

                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <div className="metric-card p-3 border rounded bg-light">
                      <div className="small text-secondary">Avg Heart Rate</div>
                      <div className="fw-semibold">{trendSummary.heartRate}</div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="metric-card p-3 border rounded bg-light">
                      <div className="small text-secondary">Avg Oxygen Level</div>
                      <div className="fw-semibold">{trendSummary.oxygenLevel}</div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="metric-card p-3 border rounded bg-light">
                      <div className="small text-secondary">Avg Temperature</div>
                      <div className="fw-semibold">{trendSummary.temperature}</div>
                    </div>
                  </div>
                </div>

                {selectedVitals.length === 0 ? (
                  <p className="text-secondary mb-0">No vitals records available for this patient.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Heart Rate</th>
                          <th>Blood Pressure</th>
                          <th>Oxygen Level</th>
                          <th>Temperature</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedVitals.map((vital) => (
                          <tr key={vital?.id ?? `${vital?.recordedTime}-${vital?.heartRate}`}>
                            <td>{formatDateTime(vital?.recordedTime || vital?.date)}</td>
                            <td>{vital?.heartRate ?? "-"}</td>
                            <td>
                              {vital?.bpSystolic != null && vital?.bpDiastolic != null
                                ? `${vital.bpSystolic}/${vital.bpDiastolic}`
                                : vital?.bloodPressure || "-"}
                            </td>
                            <td>{vital?.oxygenLevel ?? "-"}</td>
                            <td>{vital?.temperature ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-body">
                <h2 className="h5 mb-3">Medical History</h2>

                {selectedHistory.length === 0 ? (
                  <p className="text-secondary mb-0">No medical history records available.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Condition</th>
                          <th>Diagnosis</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedHistory.map((record) => (
                          <tr key={record?.id ?? `${record?.recordTime}-${record?.diagnosis}`}>
                            <td>{formatDateTime(record?.recordTime || record?.date)}</td>
                            <td>{record?.condition ?? record?.diagnosis ?? "-"}</td>
                            <td>{record?.diagnosis ?? "-"}</td>
                            <td>{record?.notes ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
