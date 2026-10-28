import { DEFAULT_CONCESSIONS } from "@/lib/student-importer";
import type { ClassFeeConfig, ConcessionCategoryConfig } from "@/lib/types";

type StoredBillingConfiguration = { feeStructureJson?: string | null; concessionsJson?: string | null } | null;

/** One compatibility parser for the existing JSON-backed billing settings. */
export function parseBillingConfiguration(school: StoredBillingConfiguration) {
  let feeStructure: ClassFeeConfig[] = [];
  let concessions: ConcessionCategoryConfig = DEFAULT_CONCESSIONS;
  try {
    const fees = school?.feeStructureJson ? JSON.parse(school.feeStructureJson) : [];
    feeStructure = Array.isArray(fees) ? fees : [];
    const parsed = school?.concessionsJson ? JSON.parse(school.concessionsJson) : null;
    concessions = parsed && typeof parsed === "object" ? { ...DEFAULT_CONCESSIONS, ...parsed } : DEFAULT_CONCESSIONS;
  } catch {
    // Retain the same defaults and legacy bill fallback as the existing services.
  }
  return { feeStructure, concessions };
}
