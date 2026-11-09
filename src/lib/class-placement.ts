export const CLASS_LEVELS = [
  "Pre-Nursery",
  "Nursery 1",
  "Nursery 2",
  "Pre-Basic",
  "Basic 1",
  "Basic 2",
  "Basic 3",
  "Basic 4",
  "Basic 5",
  "Basic 6",
  "JSS 1",
  "JSS 2",
  "JSS 3",
  "SS 1",
  "SS 2",
  "SS 3",
] as const;

/** "JSS 1 A" is level JSS 1 and arm A. "SS 1" does not match "SS 10". */
export function splitClassName(className: string): { level: string; arm: string } {
  const clean = (className || "").trim().replace(/\s+/g, " ");
  if (!clean) return { level: "", arm: "" };
  const lower = clean.toLowerCase();
  const levels = [...CLASS_LEVELS].sort((a, b) => b.length - a.length);
  for (const level of levels) {
    const token = level.toLowerCase();
    if (lower === token) return { level, arm: "" };
    if (lower.startsWith(`${token} `)) return { level, arm: clean.slice(level.length).trim() };
  }
  const parts = clean.split(" ");
  if (parts.length > 1) return { level: parts.slice(0, -1).join(" "), arm: parts[parts.length - 1] };
  return { level: clean, arm: "" };
}

export function classLevelOrder(level: string): number {
  const index = CLASS_LEVELS.findIndex((item) => item.toLowerCase() === level.toLowerCase());
  return index === -1 ? CLASS_LEVELS.length : index;
}
