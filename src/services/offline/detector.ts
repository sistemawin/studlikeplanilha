/**
 * Returns true if the browser reports an active network connection.
 * Defaults to true in non-browser environments (SSR, tests without stubbing).
 */
export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

/**
 * Registers a callback for when the browser regains network connectivity.
 * Returns a cleanup function that removes the listener.
 */
export function onReconnect(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", fn);
  return () => window.removeEventListener("online", fn);
}
