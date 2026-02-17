const ASSIGNMENT_STORAGE_KEY = "pms_patient_doctor_assignments";

function readAssignments() {
  try {
    const raw = localStorage.getItem(ASSIGNMENT_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAssignments(assignments) {
  localStorage.setItem(ASSIGNMENT_STORAGE_KEY, JSON.stringify(assignments));
}

export function getAssignedDoctorId(patientId) {
  const assignments = readAssignments();
  return assignments[String(patientId)] || "";
}

export function setAssignedDoctorId(patientId, doctorId) {
  const assignments = readAssignments();
  assignments[String(patientId)] = String(doctorId);
  writeAssignments(assignments);
}

export function removeAssignedDoctor(patientId) {
  const assignments = readAssignments();
  delete assignments[String(patientId)];
  writeAssignments(assignments);
}

export function getAssignedPatientIds(doctorId) {
  const assignments = readAssignments();
  const normalizedDoctorId = String(doctorId);

  return Object.keys(assignments).filter((patientId) => String(assignments[patientId]) === normalizedDoctorId);
}
