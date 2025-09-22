import { createContext } from "react";

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
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);