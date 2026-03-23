export function getErrorMessage(error, fallbackMessage = "Something went wrong.") {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

export function resolvePatientId(entry) {
  return entry?.patientId ?? entry?.patient?.id ?? entry?.patient?.patientId ?? "";
}

export function resolveDoctorId(entry) {
  return entry?.doctorId ?? entry?.doctor?.id ?? entry?.doctor?.doctorId ?? "";
}