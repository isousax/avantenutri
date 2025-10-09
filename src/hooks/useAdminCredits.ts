import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "../config/api";
import { useAuth } from "../contexts/useAuth";

export interface AdminUserCreditsRow {
  user_id: string;
  name?: string;
  email?: string;
  avaliacao_completa: { available: number; used: number; expired: number };
  reavaliacao: { available: number; used: number; expired: number };
  updated_at: string;
}

interface FetchResponse {
  ok: boolean;
  rows: AdminUserCreditsRow[];
}

export function useAdminCredits() {
  const { getAccessToken } = useAuth();
  return useQuery<FetchResponse>({
    queryKey: ["adminCredits"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("Token de acesso não encontrado");

      try {
        // Reutilizando endpoint summary - assumimos que backend pode aceitar ?all_by_user=1
        const res = await fetch(
          `${API.CONSULTATION_CREDITS_SUMMARY}?all_by_user=1`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.status === 500) {
          console.error("Server error fetching admin credits:", res.status);
          throw new Error(
            "Erro interno do servidor ao buscar créditos. Tente novamente em alguns instantes."
          );
        }

        if (res.status === 401 || res.status === 403) {
          throw new Error("Sem permissão para acessar dados de créditos");
        }

        if (!res.ok) {
          try {
            const errorData = await res.json();
            throw new Error(
              errorData.error || `Erro ${res.status}: ${res.statusText}`
            );
          } catch {
            throw new Error(`Erro ${res.status}: ${res.statusText}`);
          }
        }

        try {
          return await res.json();
        } catch {
          throw new Error("Resposta inválida do servidor");
        }
      } catch (networkError) {
        if (
          networkError instanceof Error &&
          networkError.message.includes("fetch")
        ) {
          throw new Error("Erro de conexão. Verifique sua internet.");
        }
        throw networkError;
      }
    },
    staleTime: 60_000,
    retry: (failureCount, error) => {
      // Não retry em erros de permissão ou dados inválidos
      if (
        error.message.includes("permissão") ||
        error.message.includes("Token")
      ) {
        return false;
      }
      // Retry até 2 vezes para erros de servidor
      return failureCount < 2;
    },
  });
}

export function useAdjustCredits() {
  const { getAccessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      userId: string;
      type: "avaliacao_completa" | "reavaliacao";
      delta: number;
      reason?: string;
    }) => {
      const token = await getAccessToken();
      if (!token) throw new Error("Token de acesso não encontrado");

      try {
        const res = await fetch(`${API.CONSULTATION_CREDITS}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "adjust", ...vars }),
        });

        if (res.status === 500) {
          console.error("Server error adjusting credits:", res.status);
          throw new Error(
            "Erro interno do servidor ao ajustar créditos. Tente novamente em alguns instantes."
          );
        }

        if (res.status === 400) {
          try {
            const errorData = await res.json();
            throw new Error(errorData.error || "Dados de ajuste inválidos");
          } catch {
            throw new Error("Dados de ajuste inválidos");
          }
        }

        if (res.status === 401 || res.status === 403) {
          throw new Error("Sem permissão para ajustar créditos");
        }

        if (!res.ok) {
          try {
            const errorData = await res.json();
            throw new Error(
              errorData.error || `Erro ${res.status}: ${res.statusText}`
            );
          } catch {
            throw new Error(`Erro ${res.status}: ${res.statusText}`);
          }
        }

        try {
          return await res.json();
        } catch {
          throw new Error("Resposta inválida do servidor");
        }
      } catch (networkError) {
        if (
          networkError instanceof Error &&
          networkError.message.includes("fetch")
        ) {
          throw new Error("Erro de conexão. Verifique sua internet.");
        }
        throw networkError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminCredits"] });
      qc.invalidateQueries({ queryKey: ["consultationCreditsSummary"] });
    },
  });
}
