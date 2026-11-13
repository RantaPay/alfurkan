/** Where a receipt should send the reader when they leave it. */

export function currentPath(pathname: string, search: { toString(): string }): string {
  const next = new URLSearchParams(search.toString());
  next.delete("action");
  const query = next.toString();
  const path = pathname || "/";
  return query ? `${path}?${query}` : path;
}

export function receiptHref(id: string, from: string): string {
  return `/receipts/${encodeURIComponent(id)}?from=${encodeURIComponent(from || "/")}`;
}

export function studentHref(id: string, from: string): string {
  return `/students/${encodeURIComponent(id)}?from=${encodeURIComponent(from || "/students")}`;
}

export function safeReturnPath(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  if (path.includes("\\") || path.includes("://") || /[\u0000-\u001f]/.test(path)) return fallback;
  return path;
}

export function returnLabel(path: string): string {
  const pathname = path.split("?")[0].replace(/\/+$/, "") || "/";
  if (pathname === "/") return "Dashboard";
  if (pathname === "/students") return "Students";
  if (pathname === "/receipts") return "Receipts";
  if (pathname === "/reports") return "Reports";
  if (pathname === "/settings") return "Settings";
  return "Back";
}

export function readQuery<T extends Record<string, string>>(params: URLSearchParams, defaults: T): T {
  const values = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const raw = params.get(String(key));
    if (raw !== null) values[key] = raw as T[keyof T];
  }
  return values;
}

export function queryString<T extends Record<string, string>>(defaults: T, values: T): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(defaults)) {
    const value = values[key] ?? "";
    if (value !== "" && value !== defaults[key]) params.set(key, value);
  }
  return params.toString();
}

export function queryMatches<T extends Record<string, string>>(defaults: T, values: T, params: URLSearchParams): boolean {
  for (const key of Object.keys(defaults)) {
    const value = values[key] ?? "";
    const expected = value !== "" && value !== defaults[key] ? value : null;
    const actualRaw = params.get(key);
    const actual = actualRaw !== null && actualRaw !== "" && actualRaw !== defaults[key] ? actualRaw : null;
    if (expected !== actual) return false;
  }
  return true;
}
