export {};

declare global {
  interface Window {
    dataLayer: Array<Array<string | number | object | undefined>>;
    gtag: (...args: (string | number | object | undefined)[]) => void;
    fbq: FbqFunction;
    _fbq?: FbqFunction;
  }
}

export type FbqFunction = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: (...args: unknown[]) => void;
};
