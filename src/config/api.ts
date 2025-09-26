export const API = {
  LOGIN: '/api-no-proxy/auth/login',
  REFRESH: '/api-no-proxy/auth/refresh',
  LOGOUT: '/api-no-proxy/auth/logout',
  REGISTER: '/api-no-proxy/auth/register',
  RESEND_VERIFICATION: '/api-no-proxy/auth/send-verification',
  CONFIRM_EMAIL: '/api-no-proxy/auth/confirm-email',
  PASSWORD_REQUEST_RESET: '/api-no-proxy/auth/request-reset',
  PASSWORD_RESET: '/api-no-proxy/auth/reset-password',
  CHANGE_PASSWORD: '/api-no-proxy/auth/change-password',
  ME: '/api-no-proxy/auth/me',
  PROFILE: '/api-no-proxy/auth/profile',
  ENTITLEMENTS: '/api-no-proxy/auth/entitlements',
  ADMIN_USERS: '/api-no-proxy/admin/users',
  ADMIN_AUDIT: '/api-no-proxy/admin/audit',
};

export type ApiRoutes = typeof API;