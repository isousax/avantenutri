import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts';
import Prefetch from '../utils/prefetch';

/**
 * Dispara prefetch para dietas quando cards entram em viewport (mobile/no-hover).
 * selector: CSS selector para elementos que possuem data-plan-id.
 */
export function useIntersectionPrefetch(selector = '[data-plan-id]', opts?: { rootMargin?: string; deepDelayMs?: number; includeDeep?: boolean; }) {
  const qc = useQueryClient();
  const { authenticatedFetch } = useAuth();
  const rootMargin = opts?.rootMargin || '160px 0px';
  const deepDelayMs = opts?.deepDelayMs ?? 600;
  const includeDeep = opts?.includeDeep ?? true;

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const ctx = { qc, fetcher: authenticatedFetch } as const;
    const deepTimers = new Map<Element, number>();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          const id = el.getAttribute('data-plan-id');
          if (id) {
            Prefetch.dietPlanDetail(ctx, id); // básico
            if (includeDeep && !qc.getQueryState(['diet-plan-detail', id, true])) {
              const t = window.setTimeout(() => {
                Prefetch.dietPlanDetail(ctx, id); // deep
                deepTimers.delete(el);
              }, deepDelayMs);
              deepTimers.set(el, t);
            }
          }
          observer.unobserve(el); // uma vez é suficiente
        }
      });
    }, { rootMargin, threshold: 0.1 });

    const nodes = document.querySelectorAll(selector);
    nodes.forEach(n => observer.observe(n));

    return () => {
      observer.disconnect();
      deepTimers.forEach(t => clearTimeout(t));
      deepTimers.clear();
    };
  }, [selector, qc, authenticatedFetch, rootMargin, deepDelayMs, includeDeep]);
}
