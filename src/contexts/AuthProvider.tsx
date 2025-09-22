import { useState, type ReactNode } from "react";
import type { User, AuthContextType } from "../types/auth";
import { AuthContext } from "./AuthContext";
import { MOCK_CREDENTIALS, MOCK_USERS } from "../mocks/users";

const STORAGE_KEY = "@AvanteNutri:user";
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

/**
 * Provedor de autenticação que gerencia o estado do usuário e funções de autenticação.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Tenta recuperar usuário do localStorage na inicialização
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const { user, expiresAt, rememberMe } = JSON.parse(storedData);
      if (expiresAt > Date.now() || rememberMe) {
        return user;
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return null;
  });

  const saveUserToStorage = (userData: User, rememberMe: boolean) => {
    const data = {
      user: userData,
      expiresAt: Date.now() + SESSION_EXPIRY,
      rememberMe,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const contextValue: AuthContextType = {
    user,
    login: async (
      email: string,
      password: string,
      rememberMe: boolean = false
    ) => {
      let userData: User | null = null;


      if (email === MOCK_CREDENTIALS.admin.email && password === MOCK_CREDENTIALS.admin.password) {
        userData = MOCK_USERS.admin;
      } else if (email === MOCK_CREDENTIALS.patient.email && password === MOCK_CREDENTIALS.patient.password) {
        userData = MOCK_USERS.patient;
      }

      if (userData) {
        setUser(userData);
        saveUserToStorage(userData, rememberMe);
        return true;
      }
      return false;
    },
    logout: () => {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
    },
    updateUser: (userData: Partial<User>) => {
      if (user) {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        // Mantém as configurações de rememberMe ao atualizar usuário
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
          const { rememberMe } = JSON.parse(storedData);
          saveUserToStorage(updatedUser, rememberMe);
        }
      }
    },
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
