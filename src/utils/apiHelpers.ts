/**
 * Utilitários para tratamento seguro de respostas de API
 */

/**
 * Faz parse seguro de JSON de uma resposta.
 * Trata o caso onde a resposta não é JSON válido (ex: HTML de erro).
 */
export async function safeJsonParse<T = any>(response: Response): Promise<T> {
  try {
    return await response.json();
  } catch {
    // Se não conseguir fazer parse do JSON, joga um erro mais claro
    throw new Error('Resposta inválida do servidor');
  }
}

/**
 * Faz uma requisição e trata tanto erros HTTP quanto parse de JSON
 */
export async function fetchWithSafeJson<T = any>(
  fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>,
  input: RequestInfo,
  init?: RequestInit,
  errorMessage = 'Erro na requisição'
): Promise<T> {
  const response = await fetch(input, init);
  const data = await safeJsonParse<T>(response);
  
  if (!response.ok) {
    throw new Error((data as any)?.error || errorMessage);
  }
  
  return data;
}