import { ENV } from "./env";

const API_AUTH_BASE =
  ENV.API_AUTH_BASE || `https://login-service.avantenutri.workers.dev`;

export const API = {
  API_AUTH_BASE:
    ENV.API_AUTH_BASE || `https://login-service.avantenutri.workers.dev`,
  LOGIN: `${API_AUTH_BASE}/auth/login`,
  REFRESH: `${API_AUTH_BASE}/auth/refresh`,
  LOGOUT: `/api/logout/logout`,
  REGISTER: `${API_AUTH_BASE}/auth/register`,
  RESEND_VERIFICATION: `${API_AUTH_BASE}/auth/resend-verification`,
  CONFIRM_EMAIL: `${API_AUTH_BASE}/auth/confirm-verification`,
  PASSWORD_REQUEST_RESET: `${API_AUTH_BASE}/auth/request-reset`,
  PASSWORD_RESET: `${API_AUTH_BASE}/auth/reset-password`,
  CHANGE_PASSWORD: `${API_AUTH_BASE}/auth/change-password`,
  ME: `/api/data/me`,
  PROFILE: `${API_AUTH_BASE}/auth/profile`,
  ADMIN_USERS: `${API_AUTH_BASE}/admin/users`,
  ADMIN_AUDIT: `${API_AUTH_BASE}/admin/audit`,
  ADMIN_CONSULTATIONS: `${API_AUTH_BASE}/admin/consultations`,
  ADMIN_CONSULTATION_AVAILABILITY: `${API_AUTH_BASE}/admin/consultations/availability`,
  ADMIN_CONSULTATION_AVAILABILITY_LOG: `${API_AUTH_BASE}/admin/consultations/availability/log`,
  ADMIN_CONSULTATION_BLOCK: `${API_AUTH_BASE}/admin/consultations/block-slot`,
  ADMIN_CONSULTATION_PRICING: `${API_AUTH_BASE}/admin/consultations/pricing`,
  adminUserRole: (id: string) => `${API_AUTH_BASE}/admin/users/${id}/role`,
  adminUserForceLogout: (id: string) => `${API_AUTH_BASE}/admin/users/${id}/force-logout`,
  adminUserQuestionnaire: (id: string) => `${API_AUTH_BASE}/admin/users/${id}/questionnaire`,
  // Overrides (admin)
  ADMIN_OVERRIDES: `${API_AUTH_BASE}/admin/overrides`,
  ADMIN_OVERRIDES_LOGS: `${API_AUTH_BASE}/admin/overrides/logs`,
  adminOverrideId: (id: string) => `${API_AUTH_BASE}/admin/overrides/${id}`,
  // Diet Plans
  DIET_PLANS: `${API_AUTH_BASE}/diet/plans`, // GET (list) / POST (create)
  dietPlan: (id: string) => `${API_AUTH_BASE}/diet/plans/${id}`, // GET / PATCH
  dietPlanRevise: (id: string) => `${API_AUTH_BASE}/diet/plans/${id}/revise`, // POST
  // Water Logs
  WATER_LOGS: `${API_AUTH_BASE}/water/logs`, // GET (range) / POST (create)
  WATER_SUMMARY: `${API_AUTH_BASE}/water/summary`, // GET (aggregate)
  WATER_GOAL: `${API_AUTH_BASE}/water/goal`, // GET / PUT
  WATER_SETTINGS: `${API_AUTH_BASE}/water/settings`, // PATCH (cup size)
  // Weight Logs
  WEIGHT_LOGS: `${API_AUTH_BASE}/weight/logs`, // GET / POST
  WEIGHT_SUMMARY: `${API_AUTH_BASE}/weight/summary`, // GET
  WEIGHT_GOAL: `${API_AUTH_BASE}/weight/goal`, // PUT (set)
  // Meal Logs
  MEAL_LOGS: `${API_AUTH_BASE}/meal/logs`, // GET / POST
  MEAL_SUMMARY: `${API_AUTH_BASE}/meal/summary`, // GET
  MEAL_GOALS: `${API_AUTH_BASE}/meal/goals`, // PUT
  mealLogId: (id: string) => `${API_AUTH_BASE}/meal/logs/${id}`, // PATCH / DELETE
  weightLogDate: (date: string) => `${API_AUTH_BASE}/weight/logs/${date}`, // PATCH
  // Consultations
  CONSULTATIONS: `${API_AUTH_BASE}/consultations`, // GET list / POST create
  consultationCancel: (id: string) => `${API_AUTH_BASE}/consultations/${id}/cancel`, // PATCH cancel
  CONSULTATION_AVAILABLE_SLOTS: `${API_AUTH_BASE}/consultations/available`,
  // Questionnaire
  QUESTIONNAIRE: `${API_AUTH_BASE}/questionnaire`, // GET / POST upsert
  QUESTIONNAIRE_STATUS: `${API_AUTH_BASE}/questionnaire/status`, // GET quick status check
  // Plans & Billing
  BILLING_INTENT: `${API_AUTH_BASE}/billing/intent`, // POST create payment intent
  BILLING_PAY: `${API_AUTH_BASE}/billing/pay`, // POST process payment
  BILLING_STATUS: `${API_AUTH_BASE}/billing/status`, // GET payment status
  BILLING_PAYMENTS: `${API_AUTH_BASE}/billing/payments`, // GET list user payments
  CONSULTATION_CREDITS: `${API_AUTH_BASE}/consultations/credits`, // GET list credits
  CONSULTATION_CREDITS_SUMMARY: `${API_AUTH_BASE}/consultations/credits/summary`, // GET credits summary
  CONSULTATION_PRICING_PUBLIC: `${API_AUTH_BASE}/consultations/pricing`, // Public pricing list
  CONSULTATION_PRICING_STATUS: `${API_AUTH_BASE}/consultations/pricing/status`, // Public pricing hash/status
  // Admin
  ADMIN_PAYMENTS: `${API_AUTH_BASE}/admin/payments`, // GET list all payments (admin only)
  ADMIN_QUESTIONNAIRE_ANALYTICS: `${API_AUTH_BASE}/admin/questionnaire/analytics`, // GET analytics
  ADMIN_NOTIFICATIONS: `${API_AUTH_BASE}/admin/notifications`, // POST send notification
  // Notifications
  NOTIFICATIONS: `${API_AUTH_BASE}/notifications`, // GET list user notifications
  notificationRead: (id: string) => `${API_AUTH_BASE}/notifications/${id}/read`, // POST mark as read
  NOTIFICATIONS_READ_ALL: `${API_AUTH_BASE}/notifications/read-all`, // POST mark all as read
  // Blog
  BLOG_POSTS: `${API_AUTH_BASE}/blog/posts`, // GET list posts
  blogPost: (slug: string) => `${API_AUTH_BASE}/blog/posts/${slug}`, // GET single post
  blogPostRelated: (slug: string) => `${API_AUTH_BASE}/blog/posts/${slug}/related`, // GET related posts
} as const;

export type ApiRoutes = typeof API;
