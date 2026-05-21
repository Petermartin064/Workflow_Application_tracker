import axios from "axios";
import type {
  Application,
  ApplicationListItem,
  CreateApplicationPayload,
  UpdateApplicationPayload,
  DecisionPayload,
} from "../types";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// List all applications, optionally filtered by status and search query
export const listApplications = (status?: string, q?: string): Promise<ApplicationListItem[]> => {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (q) params.q = q;
  return api.get("/applications/", { params }).then((r) => r.data);
};

// Get single application detail
export const getApplication = (id: number): Promise<Application> =>
  api.get(`/applications/${id}`).then((r) => r.data);

// Create a new draft
export const createApplication = (payload: CreateApplicationPayload): Promise<Application> =>
  api.post("/applications/", payload).then((r) => r.data);

// Update a draft / need-more-info application
export const updateApplication = (id: number, payload: UpdateApplicationPayload): Promise<Application> =>
  api.patch(`/applications/${id}`, payload).then((r) => r.data);

export async function login(username: string, password: string): Promise<{ access_token: string; token_type: string }> {
  const { data } = await api.post(`/applications/auth/login`, { username, password });
  return data;
}

export async function register(username: string, password: string, email: string): Promise<{ access_token: string; token_type: string }> {
  const { data } = await api.post(`/applications/auth/register`, { username, password, email });
  return data;
}

// Submit application
export const submitApplication = (id: number): Promise<Application> =>
  api.post(`/applications/${id}/submit`).then((r) => r.data);

// Start review
export const startReview = (id: number): Promise<Application> =>
  api.post(`/applications/${id}/start-review`).then((r) => r.data);

// Record reviewer decision
export const recordDecision = (id: number, payload: DecisionPayload): Promise<Application> =>
  api.post(`/applications/${id}/decision`, payload).then((r) => r.data);
