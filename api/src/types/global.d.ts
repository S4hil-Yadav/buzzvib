export {};

declare global {
  var logApiInfo: (...args: unknown[]) => void;
  var logApiError: (...args: unknown[]) => void;
}
