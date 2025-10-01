// Helper para unificar lógica de exibir skeleton apenas no carregamento inicial
// Considera "carregamento inicial" quando loading === true e todos os valores informados
// ainda estão vazios / null / arrays vazias.
export function isInitialLoading(loading: boolean, ...values: any[]): boolean {
  if (!loading) return false;
  return values.every(v => {
    if (v == null) return true;
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === 'object') {
      // Objetos simples: considerar vazio se não tiver chaves
      return Object.keys(v).length === 0;
    }
    // Valores primitivos numéricos/strings: considerar "sem dado" se equivalem a 0 ou ''
    if (typeof v === 'number') return v === 0; // ajuste conforme necessidade
    if (typeof v === 'string') return v.trim() === '';
    return false;
  });
}

// Pequeno atalho semântico para clareza em chamadas
export const shouldShowSkeleton = isInitialLoading;