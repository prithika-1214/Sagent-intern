const APPOINTMENT_LINKS_KEY = "pms_appointment_links";
const MEDICAL_HISTORY_LINKS_KEY = "pms_medical_history_links";

function readMap(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(storageKey, value) {
  localStorage.setItem(storageKey, JSON.stringify(value));
}

export function setAppointmentLink(appointmentId, patientId, doctorId) {
  if (!appointmentId) {
    return;
  }

  const map = readMap(APPOINTMENT_LINKS_KEY);
  map[String(appointmentId)] = {
    patientId: patientId != null ? String(patientId) : "",
    doctorId: doctorId != null ? String(doctorId) : ""
  };
  writeMap(APPOINTMENT_LINKS_KEY, map);
}

export function getAppointmentLink(appointmentId) {
  const map = readMap(APPOINTMENT_LINKS_KEY);
  return map[String(appointmentId)] || null;
}

export function getAppointmentIdsByPatient(patientId) {
  const map = readMap(APPOINTMENT_LINKS_KEY);
  const normalizedPatientId = String(patientId);

  return Object.keys(map).filter((appointmentId) => String(map[appointmentId]?.patientId) === normalizedPatientId);
}

export function getAppointmentIdsByDoctor(doctorId) {
  const map = readMap(APPOINTMENT_LINKS_KEY);
  const normalizedDoctorId = String(doctorId);

  return Object.keys(map).filter((appointmentId) => String(map[appointmentId]?.doctorId) === normalizedDoctorId);
}

export function removeAppointmentLink(appointmentId) {
  const map = readMap(APPOINTMENT_LINKS_KEY);
  delete map[String(appointmentId)];
  writeMap(APPOINTMENT_LINKS_KEY, map);
}

export function addMedicalHistoryLink(patientId, historyId) {
  if (!patientId || !historyId) {
    return;
  }

  const map = readMap(MEDICAL_HISTORY_LINKS_KEY);
  const key = String(patientId);
  const existing = Array.isArray(map[key]) ? map[key].map((item) => String(item)) : [];
  const next = Array.from(new Set([...existing, String(historyId)]));
  map[key] = next;
  writeMap(MEDICAL_HISTORY_LINKS_KEY, map);
}

export function removeMedicalHistoryLink(patientId, historyId) {
  if (!patientId || !historyId) {
    return;
  }

  const map = readMap(MEDICAL_HISTORY_LINKS_KEY);
  const key = String(patientId);
  const existing = Array.isArray(map[key]) ? map[key].map((item) => String(item)) : [];
  map[key] = existing.filter((item) => item !== String(historyId));
  writeMap(MEDICAL_HISTORY_LINKS_KEY, map);
}

export function getMedicalHistoryIdsByPatient(patientId) {
  if (!patientId) {
    return [];
  }

  const map = readMap(MEDICAL_HISTORY_LINKS_KEY);
  const ids = map[String(patientId)];
  return Array.isArray(ids) ? ids.map((item) => String(item)) : [];
}
