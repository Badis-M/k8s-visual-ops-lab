import { AsyncLocalStorage } from "node:async_hooks";

// Start's global middleware runs before its own request context exists.
// Keep this value local to the asynchronous request, including streamed SSR.
export const nonceContext = new AsyncLocalStorage<string>();
export function getRequestNonce(): string {
  const nonce = nonceContext.getStore();
  if (!nonce) throw new Error("Missing request CSP nonce");
  return nonce;
}
