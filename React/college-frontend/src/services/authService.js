import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

const isSuccessMessage = (value) =>
  typeof value === "string" && value.toLowerCase().includes("success");

const toError = (value, fallback) =>
  typeof value === "string" && value.trim() ? value : fallback;

const basicTokenFromCredentials = (email, password) =>
  btoa(`${email}:${password}`);

const syntheticUser = ({ email, role, token, userId = null, name = null }) => ({
  email,
  role,
  token,
  authScheme: "Basic",
  name: name || email?.split("@")?.[0] || role,
  userId,
});

const fetchStudentProfile = async (email, basicToken) => {
  const { data } = await api.get(ENDPOINTS.AUTH.STUDENTS, {
    headers: { Authorization: `Basic ${basicToken}` },
  });

  return data.find((student) => String(student.email).toLowerCase() === String(email).toLowerCase()) || null;
};

const fetchOfficerProfile = async (email, basicToken) => {
  const { data } = await api.get(ENDPOINTS.AUTH.OFFICERS, {
    headers: { Authorization: `Basic ${basicToken}` },
  });

  return data.find((officer) => String(officer.email).toLowerCase() === String(email).toLowerCase()) || null;
};

export const authService = {
  async registerStudent(payload) {
    const body = {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      dob: payload.dob || null,
    };

    let data;
    try {
      const response = await api.post(ENDPOINTS.AUTH.STUDENT_REGISTER, body);
      data = response.data;
    } catch (error) {
      if (error?.response?.status === 401) {
        throw new Error(
          "Backend is denying registration (401). Enable permitAll for POST /auth/student/register in Spring Security.",
        );
      }
      throw error;
    }

    if (!isSuccessMessage(data)) {
      throw new Error(toError(data, "Registration failed."));
    }

    return { message: data };
  },

  async registerOfficer(payload) {
    const body = {
      name: payload.name,
      email: payload.email,
      password: payload.password,
    };

    let data;
    try {
      const response = await api.post(ENDPOINTS.AUTH.OFFICER_REGISTER, body);
      data = response.data;
    } catch (error) {
      if (error?.response?.status === 401) {
        throw new Error(
          "Backend is denying registration (401). Enable permitAll for POST /auth/officer/register in Spring Security.",
        );
      }
      throw error;
    }

    if (!isSuccessMessage(data)) {
      throw new Error(toError(data, "Officer registration failed."));
    }

    return { message: data };
  },

  async loginStudent(payload) {
    const { data } = await api.post(ENDPOINTS.AUTH.STUDENT_LOGIN, payload);
    if (!isSuccessMessage(data)) {
      throw new Error(toError(data, "Login failed."));
    }

    const basicToken = basicTokenFromCredentials(payload.email, payload.password);
    const student = await fetchStudentProfile(payload.email, basicToken);

    return syntheticUser({
      email: payload.email,
      role: "STUDENT",
      token: basicToken,
      userId: student?.stuId ?? null,
      name: student?.name,
    });
  },

  async loginOfficer(payload) {
    const { data } = await api.post(ENDPOINTS.AUTH.OFFICER_LOGIN, payload);
    if (!isSuccessMessage(data)) {
      throw new Error(toError(data, "Login failed."));
    }

    const basicToken = basicTokenFromCredentials(payload.email, payload.password);
    const officer = await fetchOfficerProfile(payload.email, basicToken);

    return syntheticUser({
      email: payload.email,
      role: "OFFICER",
      token: basicToken,
      userId: officer?.offId ?? null,
      name: officer?.name,
    });
  },

  async getUsers() {
    const { data } = await api.get(ENDPOINTS.AUTH.STUDENTS);
    return data;
  },

  async getUserById(id) {
    const { data } = await api.get(ENDPOINTS.AUTH.STUDENT_BY_ID(id));
    return data;
  },
};
