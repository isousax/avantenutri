import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API } from '../config/api';
import { useEffect, useRef } from 'react';

export interface ConsultationPricingEntry {
  type: 'avaliacao_completa' | 'reavaliacao' | string;
  amount_cents: number;
  currency: string;
  updated_at?: string;
}

interface PricingResponse { ok: boolean; pricing: ConsultationPricingEntry[] }

/**
 * Hook público de preços de consulta com invalidação leve baseada em hash
 * Endpoint /consultations/pricing/status retorna algo como { ok: true, hash: string }
 * Polling passivo a cada ~60s apenas para comparar hash e invalidar cache se mudou.
 * Evita refetch contínuo desnecessário dos dados principais.
 */
export function useConsultationPricing() {
  const queryClient = useQueryClient();
  const hashRef = useRef<string | null>(null);

  const pricingQuery = useQuery<PricingResponse>({
    queryKey: ['consultationPricingPublic'],
    queryFn: async () => {
      const res = await fetch(API.CONSULTATION_PRICING_PUBLIC);
      if (!res.ok) throw new Error('failed_fetch_pricing');
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Poll leve do status para detectar mudanças (hash) sem trazer payload completo
  useEffect(() => {
    let interval: number | undefined;

    const check = async () => {
      try {
        const res = await fetch(API.CONSULTATION_PRICING_STATUS, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const newHash = json?.hash;
        if (newHash && hashRef.current && newHash !== hashRef.current) {
          // Hash mudou: invalidar query para refetch próximo acesso
            queryClient.invalidateQueries({ queryKey: ['consultationPricingPublic'] });
        }
        if (newHash && !hashRef.current) hashRef.current = newHash;
      } catch {
        /* ignora erros silenciosamente */
      }
    };

    // Atualiza hash inicial assim que temos dados (se API principal expuser updated_at)
    if (pricingQuery.data?.ok && pricingQuery.data.pricing[0]?.updated_at) {
      hashRef.current = pricingQuery.data.pricing[0].updated_at;
    }

    check();
    interval = window.setInterval(check, 60_000); // 60s
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [queryClient, pricingQuery.data]);

  return pricingQuery;
}
