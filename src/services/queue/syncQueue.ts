const QUEUE_KEY = "studlike_pending_sync_v1";

type PendingEntry = {
  userId: string;
  enqueuedAt: string;
};

/**
 * Marks that a sync is pending for userId.
 * Idempotent — calling multiple times is safe.
 */
export function enqueuePendingSync(userId: string): void {
  try {
    const entry: PendingEntry = { userId, enqueuedAt: new Date().toISOString() };
    localStorage.setItem(QUEUE_KEY, JSON.stringify(entry));
  } catch {}
}

/**
 * Returns true if there is a pending sync for the given userId.
 */
export function hasPendingSync(userId: string): boolean {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return false;
    const entry = JSON.parse(raw) as PendingEntry;
    return entry.userId === userId;
  } catch {
    return false;
  }
}

/**
 * Clears the pending sync marker after a successful sync.
 */
export function clearPendingSync(): void {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {}
}
