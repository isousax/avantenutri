export type User = {
  id: string;
  name: string;
  email: string;
  role: "paciente" | "admin";
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
}