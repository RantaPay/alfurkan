let online = true;

export function setConnectionOnline(value: boolean) {
  online = value;
}

export function isConnectionOnline() {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  return online;
}

export function openOffline(href: string) {
  if (typeof window === "undefined") return;
  if (!isConnectionOnline()) {
    window.location.assign(href);
    return true;
  }
  return false;
}
