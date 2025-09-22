import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import type { AuthContextType } from "../types/auth";

/**
 * Hook personalizado para acessar o contexto de autenticação.
 * Retorna as funções e dados do usuário atual.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  
  return context;
};