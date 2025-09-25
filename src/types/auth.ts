export type User = {
  id: string;
  full_name: string;
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
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  authenticatedFetch: (input: RequestInfo | URL, init?: RequestInit & { autoLogout?: boolean }) => Promise<Response>;
  refreshSession: () => Promise<boolean>;
}