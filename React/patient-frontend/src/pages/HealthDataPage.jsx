import { useEffect, useState } from "react";
import { createMedicalHistory, deleteMedicalHistory, getMedicalHistories } from "../api/medicalHistory";
import { getPatientById, getPatients } from "../api/patients";
import { createVital, deleteVital, getVitals } from "../api/vitals";
import ErrorAlert from "../components/ErrorAlert";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../context/AuthContext";
import { getAssignedDoctorId } from "../utils/assignments";
import { formatDateTime, getErrorMessage } from "../utils/formatters";
import {
  addMedicalHistoryLink,
  getMedicalHistoryIdsByPatient,
  removeMedicalHistoryLink
} from "../utils/recordLinks";

const today = new Date().toISOString().slice(0, 10);

const initialVitalForm = {
  heartRate: "",
  bloodPressure: "",
  oxygenLevel: "",
  temperature: "",
  date: today
};

const initialHistoryForm = {
  condition: "",
  diagnosis: "",
  notes: "",
  date: today
};

function toArray(data) {
  return Array.isArray(data) ? data : [];
}

function getVitalId(vital) {
  return vital?.id ?? vital?.vitalId;
}

function getHistoryId(history) {
  return history?.id ?? history?.recordId ?? history?.historyId;
}

function parseBloodPressure(value) {
  const match = value.trim().match(/^(\d{2,3})\/(\d{2,3})$/);
  if (!match) {
    return null;
  }

  return {
    systolic: Number(match[1]),
    diastolic: Number(match[2])
  };
}

function validateVital(form) {
  const errors = {};
  const bp = parseBloodPressure(form.bloodPressure);

  if (!form.heartRate || Number.isNaN(Number(form.heartRate))) {
    errors.heartRate = "Heart rate is required.";
  }

  if (!bp) {
    errors.bloodPressure = "Blood pressure format must be like 120/80.";
  }

  if (!form.oxygenLevel || Number.isNaN(Number(form.oxygenLevel))) {
    errors.oxygenLevel = "Oxygen level is required.";
  }

  if (!form.temperature || Number.isNaN(Number(form.temperature))) {
    errors.temperature = "Temperature is required.";
  }

  if (!form.date) {
    errors.date = "Date is required.";
  }

  return errors;
}

function validateHistory(form) {
  const errors = {};

  if (!form.condition.trim() && !form.diagnosis.trim()) {
    errors.condition = "Condition or diagnosis is required.";
  }

  if (!form.notes.trim()) {
    errors.notes = "Notes are required.";
  }

  if (!form.date) {
    errors.date = "Date is required.";
  }

  return errors;
}

export default function HealthDataPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const patientId = user?.id ? String(user.id) : "";
  const assignedDoctorId = getAssignedDoctorId(patientId);

  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);

  const [vitalForm, setVitalForm] = useState(initialVitalForm);
  const [historyForm, setHistoryForm] = useState(initialHistoryForm);
  const [vitalErrors, setVitalErrors] = useState({});
  const [historyErrors, setHistoryErrors] = useState({});

  const [loading, setLoading] = useState(true);
  const [submittingVital, setSubmittingVital] = useState(false);
  const [submittingHistory, setSubmittingHistory] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    if (!patientId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [patientsData, patientData, vitalsData, historyData] = await Promise.all([
        getPatients(),
        getPatientById(patientId),
        getVitals(),
        getMedicalHistories()
      ]);

      const isSinglePatientMode = toArray(patientsData).length <= 1;
      const allVitals = toArray(vitalsData);
      let filteredVitals = allVitals.filter(
        (entry) => String(entry?.patient?.id ?? entry?.patient?.patientId ?? "") === String(patientId)
      );
      if (filteredVitals.length === 0 && isSinglePatientMode) {
        filteredVitals = allVitals;
      }

      const linkedHistoryIdSet = new Set(getMedicalHistoryIdsByPatient(patientId));
      const linkedHistory = toArray(historyData).filter((entry) =>
        linkedHistoryIdSet.has(String(getHistoryId(entry)))
      );
      const historyById = new Map();

      toArray(patientData?.medicalHistories).forEach((entry) => {
        historyById.set(String(getHistoryId(entry)), entry);
      });
      linkedHistory.forEach((entry) => {
        historyById.set(String(getHistoryId(entry)), entry);
      });
      if (historyById.size === 0 && isSinglePatientMode) {
        toArray(historyData).forEach((entry) => {
          const historyId = getHistoryId(entry);
          if (historyId == null || historyId === "") {
            return;
          }

          historyById.set(String(historyId), entry);
          addMedicalHistoryLink(patientId, historyId);
        });
      }

      setPatient(patientData);
      setVitals(filteredVitals);
      setMedicalHistory(Array.from(historyById.values()));
    } catch (apiError) {
      const message = getErrorMessage(apiError, "Unable to load health data.");
      setError(message);
      showToast({ title: "Load Failed", message, variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  const handleVitalInput = (event) => {
    const { name, value } = event.target;
    setVitalForm((prev) => ({ ...prev, [name]: value }));
    setVitalErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleHistoryInput = (event) => {
    const { name, value } = event.target;
    setHistoryForm((prev) => ({ ...prev, [name]: value }));
    setHistoryErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleAddVital = async (event) => {
    event.preventDefault();

    const validationErrors = validateVital(vitalForm);
    if (Object.keys(validationErrors).length > 0) {
      setVitalErrors(validationErrors);
      return;
    }

    const bloodPressure = parseBloodPressure(vitalForm.bloodPressure);
    setSubmittingVital(true);

    const payload = {
      heartRate: Number(vitalForm.heartRate),
      bpSystolic: bloodPressure?.systolic ?? null,
      bpDiastolic: bloodPressure?.diastolic ?? null,
      oxygenLevel: Number(vitalForm.oxygenLevel),
      recordedTime: `${vitalForm.date}T00:00:00`,
      patient: { id: Number(patientId) }
    };

    try {
      await createVital(payload);
      showToast({ title: "Vitals Added", message: "Daily vitals entry saved.", variant: "success" });
      setVitalForm({ ...initialVitalForm, date: today });
      await loadData();
    } catch (apiError) {
      const message = getErrorMessage(apiError, "Unable to save vitals.");
      setError(message);
      showToast({ title: "Save Failed", message, variant: "danger" });
    } finally {
      setSubmittingVital(false);
    }
  };

  const handleAddHistory = async (event) => {
    event.preventDefault();

    const validationErrors = validateHistory(historyForm);
    if (Object.keys(validationErrors).length > 0) {
      setHistoryErrors(validationErrors);
      return;
    }

    setSubmittingHistory(true);

    const payload = {
      diagnosis: historyForm.diagnosis.trim() || historyForm.condition.trim(),
      notes: historyForm.notes.trim(),
      recordTime: `${historyForm.date}T00:00:00`,
      patient: { id: Number(patientId) }
    };

    if (assignedDoctorId) {
      payload.doctor = { id: Number(assignedDoctorId) };
    }

    try {
      const createdHistory = await createMedicalHistory(payload);
      addMedicalHistoryLink(patientId, getHistoryId(createdHistory));
      showToast({ title: "Record Added", message: "Medical history entry saved.", variant: "success" });
      setHistoryForm({ ...initialHistoryForm, date: today });
      await loadData();
    } catch (apiError) {
      const message = getErrorMessage(apiError, "Unable to save medical history.");
      setError(message);
      showToast({ title: "Save Failed", message, variant: "danger" });
    } finally {
      setSubmittingHistory(false);
    }
  };

  const handleDeleteVital = async (id) => {
    if (!window.confirm("Delete this vitals entry?")) {
      return;
    }

    try {
      await deleteVital(id);
      showToast({ title: "Vitals Deleted", message: "Vitals entry removed.", variant: "warning" });
      await loadData();
    } catch (apiError) {
      const message = getErrorMessage(apiError, "Unable to delete vitals entry.");
      setError(message);
      showToast({ title: "Delete Failed", message, variant: "danger" });
    }
  };

  const handleDeleteHistory = async (id) => {
    if (!window.confirm("Delete this medical history entry?")) {
      return;
    }

    try {
      await deleteMedicalHistory(id);
      removeMedicalHistoryLink(patientId, id);
      showToast({ title: "History Deleted", message: "Medical history entry removed.", variant: "warning" });
      await loadData();
    } catch (apiError) {
      const message = getErrorMessage(apiError, "Unable to delete history entry.");
      setError(message);
      showToast({ title: "Delete Failed", message, variant: "danger" });
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="h4 mb-1">Health Data Entry</h1>
          <p className="text-secondary mb-0">Record vitals and maintain your medical records.</p>
        </div>
        <button type="button" className="btn btn-outline-primary" onClick={loadData}>
          Refresh Data
        </button>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError("")} />

      {patientId ? (
        <div className="alert alert-info mb-0" role="alert">
          Recording data for patient ID <strong>{patientId}</strong> ({patient?.name || "Patient"}).
        </div>
      ) : null}

      {loading ? (
        <LoadingSpinner message="Loading vitals and medical history..." />
      ) : (
        <>
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h2 className="h5 mb-3">Add Daily Vitals</h2>

                  <form onSubmit={handleAddVital} noValidate>
                    <div className="mb-3">
                      <label htmlFor="heartRate" className="form-label fw-semibold">
                        Heart Rate (bpm)
                      </label>
                      <input
                        id="heartRate"
                        name="heartRate"
                        type="number"
                        className={`form-control ${vitalErrors.heartRate ? "is-invalid" : ""}`}
                        value={vitalForm.heartRate}
                        onChange={handleVitalInput}
                      />
                      {vitalErrors.heartRate ? <div className="invalid-feedback">{vitalErrors.heartRate}</div> : null}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="bloodPressure" className="form-label fw-semibold">
                        Blood Pressure
                      </label>
                      <input
                        id="bloodPressure"
                        name="bloodPressure"
                        type="text"
                        placeholder="120/80"
                        className={`form-control ${vitalErrors.bloodPressure ? "is-invalid" : ""}`}
                        value={vitalForm.bloodPressure}
                        onChange={handleVitalInput}
                      />
                      {vitalErrors.bloodPressure ? (
                        <div className="invalid-feedback">{vitalErrors.bloodPressure}</div>
                      ) : null}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="oxygenLevel" className="form-label fw-semibold">
                        Oxygen Level (%)
                      </label>
                      <input
                        id="oxygenLevel"
                        name="oxygenLevel"
                        type="number"
                        className={`form-control ${vitalErrors.oxygenLevel ? "is-invalid" : ""}`}
                        value={vitalForm.oxygenLevel}
                        onChange={handleVitalInput}
                      />
                      {vitalErrors.oxygenLevel ? (
                        <div className="invalid-feedback">{vitalErrors.oxygenLevel}</div>
                      ) : null}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="temperature" className="form-label fw-semibold">
                        Temperature
                      </label>
                      <input
                        id="temperature"
                        name="temperature"
                        type="number"
                        step="0.1"
                        className={`form-control ${vitalErrors.temperature ? "is-invalid" : ""}`}
                        value={vitalForm.temperature}
                        onChange={handleVitalInput}
                      />
                      {vitalErrors.temperature ? <div className="invalid-feedback">{vitalErrors.temperature}</div> : null}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="vitalDate" className="form-label fw-semibold">
                        Date
                      </label>
                      <input
                        id="vitalDate"
                        name="date"
                        type="date"
                        className={`form-control ${vitalErrors.date ? "is-invalid" : ""}`}
                        value={vitalForm.date}
                        onChange={handleVitalInput}
                      />
                      {vitalErrors.date ? <div className="invalid-feedback">{vitalErrors.date}</div> : null}
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={submittingVital}>
                      {submittingVital ? "Saving..." : "Save Vitals"}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h2 className="h5 mb-3">Add Medical History</h2>

                  <form onSubmit={handleAddHistory} noValidate>
                    <div className="mb-3">
                      <label htmlFor="condition" className="form-label fw-semibold">
                        Condition
                      </label>
                      <input
                        id="condition"
                        name="condition"
                        type="text"
                        className={`form-control ${historyErrors.condition ? "is-invalid" : ""}`}
                        value={historyForm.condition}
                        onChange={handleHistoryInput}
                      />
                      {historyErrors.condition ? <div className="invalid-feedback">{historyErrors.condition}</div> : null}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="diagnosis" className="form-label fw-semibold">
                        Diagnosis
                      </label>
                      <input
                        id="diagnosis"
                        name="diagnosis"
                        type="text"
                        className="form-control"
                        value={historyForm.diagnosis}
                        onChange={handleHistoryInput}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="notes" className="form-label fw-semibold">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows="4"
                        className={`form-control ${historyErrors.notes ? "is-invalid" : ""}`}
                        value={historyForm.notes}
                        onChange={handleHistoryInput}
                      />
                      {historyErrors.notes ? <div className="invalid-feedback">{historyErrors.notes}</div> : null}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="historyDate" className="form-label fw-semibold">
                        Date
                      </label>
                      <input
                        id="historyDate"
                        name="date"
                        type="date"
                        className={`form-control ${historyErrors.date ? "is-invalid" : ""}`}
                        value={historyForm.date}
                        onChange={handleHistoryInput}
                      />
                      {historyErrors.date ? <div className="invalid-feedback">{historyErrors.date}</div> : null}
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={submittingHistory}>
                      {submittingHistory ? "Saving..." : "Save Medical Record"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h2 className="h5 mb-3">Vitals History</h2>

                  {vitals.length === 0 ? (
                    <p className="text-secondary mb-0">No vitals records found.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-striped align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Date</th>
                            <th>HR</th>
                            <th>BP</th>
                            <th>SpO2</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vitals.map((vital) => {
                            const id = getVitalId(vital);
                            return (
                              <tr key={id}>
                                <td>{formatDateTime(vital?.recordedTime || vital?.date)}</td>
                                <td>{vital?.heartRate ?? "-"}</td>
                                <td>
                                  {vital?.bpSystolic != null && vital?.bpDiastolic != null
                                    ? `${vital.bpSystolic}/${vital.bpDiastolic}`
                                    : "-"}
                                </td>
                                <td>{vital?.oxygenLevel ?? "-"}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDeleteVital(id)}
                                  >
                                    Delete
                                  </button>
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
            </div>

            <div className="col-lg-5">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h2 className="h5 mb-3">Medical History</h2>

                  {medicalHistory.length === 0 ? (
                    <p className="text-secondary mb-0">No medical history found.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-striped align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Date</th>
                            <th>Diagnosis</th>
                            <th>Notes</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {medicalHistory.map((entry) => {
                            const id = getHistoryId(entry);
                            return (
                              <tr key={id}>
                                <td>{formatDateTime(entry?.recordTime || entry?.date)}</td>
                                <td>{entry?.diagnosis || "-"}</td>
                                <td>{entry?.notes || "-"}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDeleteHistory(id)}
                                  >
                                    Delete
                                  </button>
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
            </div>
          </div>
        </>
      )}
    </div>
  );
}
