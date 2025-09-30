export type User = {
  id: string;
  full_name: string;
  display_name: string;
  email: string;
  role: "patient" | "admin";
  photoUrl?: string;
  phone?: string;
  birthDate?: string;
  weight?: number;
  targetWeight?: number;
  calorieGoal?: number;
  dailyWaterGoal?: number;
};

export interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  authenticatedFetch: (
    input: RequestInfo | URL,
    init?: RequestInit & { autoLogout?: boolean }
  ) => Promise<Response>;
  refreshSession: () => Promise<boolean>;
  syncUser: () => Promise<boolean>;
  sessionLastVerified?: number | null;
  sessionVerified?: boolean | null;
  forceVerify: () => Promise<boolean>;
  /** Returns a fresh access token if available (refreshing if needed). */
  getAccessToken: () => Promise<string | null>;
  updateProfile?: (payload: {
    display_name?: string;
    full_name?: string;
    phone?: string | null;
  }) => Promise<{ ok: true; updated: Partial<User> } | { ok: false; error: string }>;
}
