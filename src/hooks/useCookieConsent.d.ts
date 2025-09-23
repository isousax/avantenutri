export interface UseCookieConsentResult {
  consent: string | null;
  grantConsent: (level?: string) => void;
  revokeConsent: () => void;
}

declare function useCookieConsent(): UseCookieConsentResult;

export default useCookieConsent;
