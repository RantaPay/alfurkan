const CACHE = "alfurqan-app-v2";
const PAGES = ["/", "/students", "/receipts", "/reports", "/settings", "/login"];

self.addEventListener("install", (event) => {
  event.waitUntil(precachePages().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname === "/logo.png" || url.pathname === "/favicon.ico" || url.pathname.endsWith(".woff2")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  const rsc = request.headers.get("RSC") === "1" || request.headers.get("Next-Router-Prefetch") === "1" || url.searchParams.has("_rsc");
  if (request.mode === "navigate" || rsc) event.respondWith(pageFirst(request));
});

async function precachePages() {
  const cache = await caches.open(CACHE);
  await Promise.all(PAGES.map(async (page) => {
    try {
      const response = await fetch(page, { credentials: "same-origin" });
      if (!response.ok) return;
      const html = await response.clone().text();
      await cache.put(page, response);
      const assets = new Set(html.match(/\/_next\/static\/[^"'\\\s)>]+/g) || []);
      await Promise.all(Array.from(assets).map(async (asset) => {
        try {
          const file = await fetch(asset);
          if (file.ok) await cache.put(asset, file);
        } catch {
          // A missing font or chunk can be fetched again by Download for offline.
        }
      }));
    } catch {
      // Install still succeeds when the network is down.
    }
  }));
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function pageFirst(request) {
  const url = new URL(request.url);
  const rsc = request.headers.get("RSC") === "1" || request.headers.get("Next-Router-Prefetch") === "1" || url.searchParams.has("_rsc");
  url.searchParams.delete("_rsc");
  const key = `${url.pathname}${url.search}${rsc ? "|rsc" : ""}`;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(key, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(CACHE);
    const saved = (await cache.match(key)) || (!rsc && (await cache.match(url.pathname)));
    if (saved) return saved;
    if (!rsc && url.pathname.startsWith("/receipts/") && url.pathname !== "/receipts") {
      const shell = await receiptShell(cache, decodeURIComponent(url.pathname.slice("/receipts/".length)));
      if (shell) return shell;
    }
    if (!rsc && url.pathname.startsWith("/students/") && url.pathname !== "/students") {
      const shell = await studentShell(cache, decodeURIComponent(url.pathname.slice("/students/".length)));
      if (shell) return shell;
    }
    if (rsc) return new Response("", { status: 503 });
    return new Response(missingPage(url.pathname), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

async function studentShell(cache, studentId) {
  const shell = await cache.match("/__alfurqan_student_shell__");
  if (!shell) return null;
  const shellId = shell.headers.get("X-Student-Id") || "";
  let html = await shell.text();
  if (shellId && studentId) html = html.split(shellId).join(studentId);
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function receiptShell(cache, receiptId) {
  const shell = await cache.match("/__alfurqan_receipt_shell__");
  if (!shell) return null;
  const shellId = shell.headers.get("X-Receipt-Id") || "";
  let html = await shell.text();
  if (shellId && receiptId) html = html.split(shellId).join(receiptId);
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function missingPage(path) {
  const safe = path.replace(/[&<>"]/g, "");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Offline</title></head><body style="font-family:sans-serif;padding:2rem;color:#0f172a"><h1>This screen is not on this computer yet</h1><p>${safe} was not included in the last offline download.</p><p><a href="/">Back to the dashboard</a></p></body></html>`;
}
