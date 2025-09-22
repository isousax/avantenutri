import { useState, type ReactNode } from "react";
import type { User, AuthContextType } from "../types/auth";
import { AuthContext } from "./AuthContext";

// Usuários padrão para simulação
const defaultAdminUser: User = {
  id: "1",
  name: "Dra. Nutri Avante",
  email: "admin@nutri.com",
  role: "admin",
  photoUrl: "https://ui-avatars.com/api/?name=Dra+Nutri&background=22c55e&color=fff"
};

const defaultPatientUser: User = {
  id: "2",
  name: "Maria Silva",
  email: "maria@example.com",
  role: "paciente",
  photoUrl: "https://ui-avatars.com/api/?name=Maria+Silva&background=22c55e&color=fff",
  phone: "(61) 98765-4321",
  birthDate: "1990-05-15",
  weight: 72.5,
  targetWeight: 70,
  calorieGoal: 2000,
  dailyWaterGoal: 8
};

/**
 * Provedor de autenticação que gerencia o estado do usuário e funções de autenticação.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const contextValue: AuthContextType = {
    user,
    login: async (email: string, password: string) => {
      if (email === "admin@nutri.com" && password === "admin") {
        setUser(defaultAdminUser);
        return true;
      } else if (email && password) {
        setUser(defaultPatientUser);
        return true;
      }
      return false;
    },
    logout: () => {
      setUser(null);
    },
    updateUser: (userData: Partial<User>) => {
      if (user) {
        setUser({ ...user, ...userData });
      }
    }
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};