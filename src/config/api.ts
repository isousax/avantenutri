// Centralização das rotas de API usadas no front.
// Caso a base mude (ex: prefixo /v1), altere apenas aqui.
export const API = {
  LOGIN: '/api/auth/login/login',
  REFRESH: '/api/auth/login/refresh',
  LOGOUT: '/api/auth/logout/logout',
  REGISTER: '/api/auth/register/register',
  RESEND_VERIFICATION: '/api/auth/register/sendVerification',
  CONFIRM_EMAIL: '/api/auth/register/confirmEmail',
  PASSWORD_REQUEST_RESET: '/api/auth/password/requestReset',
  PASSWORD_RESET: '/api/auth/password/resetPassword',
  CHANGE_PASSWORD: '/api/auth/password/changePassword',
  ME: '/api/auth/me/me',
};

export type ApiRoutes = typeof API;
