import type { AppState } from "@/types";

const STORAGE_KEY = "studlike_state_v1";
const VERSION = 1;

type StoredEntry = {
  version: number;
  userId: string;
  state: AppState;
  savedAt: string;
};

/**
 * Persists the full AppState to localStorage, scoped to userId.
 * Silent on quota errors or private browsing restrictions.
 */
export function persistLocally(userId: string, state: AppState): void {
  try {
    const entry: StoredEntry = {
      version: VERSION,
      userId,
      state,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Quota exceeded or private browsing — not critical, sync will still work when online
  }
}

/**
 * Loads the persisted AppState for userId from localStorage.
 * Returns null if nothing is stored, the stored data belongs to a different user,
 * the version is stale, or the data is corrupted.
 */
export function loadPersisted(userId: string): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as StoredEntry;
    if (entry.version !== VERSION || entry.userId !== userId) return null;
    return entry.state;
  } catch {
    return null;
  }
}

/**
 * Removes the persisted state from localStorage (e.g., on logout).
 */
export function clearPersisted(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
