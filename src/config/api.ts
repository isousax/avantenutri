export const API = {
  LOGIN: '/api/auth/login',
  REFRESH: '/api/auth/refresh',
  LOGOUT: '/api/auth/logout',
  REGISTER: '/api/auth/register',
  RESEND_VERIFICATION: '/api/auth/send-verification',
  CONFIRM_EMAIL: '/api/auth/confirm-email',
  PASSWORD_REQUEST_RESET: '/api/auth/request-reset',
  PASSWORD_RESET: '/api/auth/reset-password',
  CHANGE_PASSWORD: '/api/auth/change-password',
  ME: '/api/auth/me',
  PROFILE: '/api/auth/profile',
  ENTITLEMENTS: '/api/auth/entitlements',
  ADMIN_USERS: '/api/admin/users',
  ADMIN_AUDIT: '/api/admin/audit',
};

export type ApiRoutes = typeof API;