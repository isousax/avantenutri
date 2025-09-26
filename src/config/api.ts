import { ENV } from "./env";

const API_AUTH_BASE = ENV.API_AUTH_BASE || `https://login-service.avantenutri.workers.dev`

export const API = {
  API_AUTH_BASE: ENV.API_AUTH_BASE || `https://login-service.avantenutri.workers.dev`,
  LOGIN: `${API_AUTH_BASE}/auth/login`,
  REFRESH: `${API_AUTH_BASE}/auth/refresh`,
  LOGOUT: `/api/auth/logout`,
  REGISTER: `${API_AUTH_BASE}/auth/register`,
  RESEND_VERIFICATION: `${API_AUTH_BASE}/auth/send-verification`,
  CONFIRM_EMAIL: `${API_AUTH_BASE}auth/confirm-email`,
  PASSWORD_REQUEST_RESET: `${API_AUTH_BASE}/auth/request-reset`,
  PASSWORD_RESET: `${API_AUTH_BASE}/auth/reset-password`,
  CHANGE_PASSWORD: `${API_AUTH_BASE}/auth/change-password`,
  ME: `/api/me/me`,
  PROFILE: `${API_AUTH_BASE}/auth/profile`,
  ENTITLEMENTS: `${API_AUTH_BASE}/auth/entitlements`,
  ADMIN_USERS: `${API_AUTH_BASE}/admin/users`,
  ADMIN_AUDIT: `${API_AUTH_BASE}/admin/audit`,
} as const;

export type ApiRoutes = typeof API;
