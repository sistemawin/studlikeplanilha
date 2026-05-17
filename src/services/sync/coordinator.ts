import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppState } from "@/types";
import { saveRemoteState } from "@/services/supabase/sync";
import { persistLocally } from "@/services/persistence/local";
import { enqueuePendingSync, clearPendingSync } from "@/services/queue/syncQueue";
import { withRetry, type BackoffOptions } from "@/services/retry/backoff";
import { isOnline } from "@/services/offline/detector";

export type SyncResult =
  | { status: "synced" }
  | { status: "queued" }
  | { status: "error"; error: Error };

const DEFAULT_RETRY: BackoffOptions = {
  maxAttempts: 3,
  baseMs: 1000,
  maxMs: 8000,
};

/**
 * Orchestrates a full-state sync:
 * 1. Always persists locally first (data is never lost even if Supabase is unreachable)
 * 2. If offline: marks sync as pending and returns "queued"
 * 3. If online: syncs to Supabase with exponential backoff retry
 * 4. On success: clears pending marker
 * 5. On exhausted retries: marks pending for flush when reconnected
 *
 * retryOpts can be overridden in tests to avoid real delays.
 */
export async function syncAppState(
  supabase: SupabaseClient,
  userId: string,
  state: AppState,
  retryOpts: BackoffOptions = DEFAULT_RETRY,
): Promise<SyncResult> {
  persistLocally(userId, state);

  if (!isOnline()) {
    enqueuePendingSync(userId);
    return { status: "queued" };
  }

  try {
    await withRetry(() => saveRemoteState(supabase, userId, state), retryOpts);
    clearPendingSync();
    return { status: "synced" };
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Sync falhou");
    enqueuePendingSync(userId);
    return { status: "error", error };
  }
}
