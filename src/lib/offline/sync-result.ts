/** How a sync answer moves a waiting receipt. Pure, so it can be tested without a database. */

export type OutboxStatus = "waiting" | "syncing" | "synced" | "needs_decision" | "reprint";

export function classifySyncResult(result: { ok: boolean; code?: string; reprint?: boolean }): OutboxStatus {
  if (!result.ok && (result.code === "DUPLICATE" || result.code === "STUDENT_MISSING" || result.code === "SESSION_CHANGED")) {
    return "needs_decision";
  }
  if (!result.ok) return "waiting";
  return result.reprint ? "reprint" : "synced";
}

export function shouldUseSnapshot(error: unknown, online: boolean): boolean {
  if (!online) return true;
  if (typeof error === "object" && error && "name" in error && (error as { name: string }).name === "AbortError") return false;
  return error instanceof TypeError;
}
