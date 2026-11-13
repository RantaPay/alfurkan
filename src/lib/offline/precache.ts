"use client";

export const APP_CACHE = "alfurqan-app-v2";
const PAGES = ["/", "/students", "/receipts", "/reports", "/settings", "/login"];

function assetsIn(text: string): string[] {
  return text.match(/\/_next\/static\/[^"'\\\s)>]+/g) || [];
}

async function save(cache: Cache, url: string, response: Response) {
  if (response.ok) await cache.put(url, response);
}

/** Saves every staff screen, its code, and one receipt screen that can open any saved receipt. */
export async function precacheApplication(receiptIds: string[], studentIds: string[] = []): Promise<void> {
  const cache = await caches.open(APP_CACHE);
  const assets = new Set<string>(["/logo.png", "/favicon.ico"]);
  for (const page of PAGES) {
    try {
      const response = await fetch(page, { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) continue;
      const html = await response.clone().text();
      await save(cache, page, response);
      assetsIn(html).forEach((asset) => assets.add(asset));
    } catch {
      // Keep the copy that is already saved.
    }
  }

  const sampleStudentId = studentIds.find(Boolean);
  if (sampleStudentId) {
    try {
      const response = await fetch(`/students/${encodeURIComponent(sampleStudentId)}`, { credentials: "same-origin", cache: "no-store" });
      if (response.ok) {
        const html = await response.clone().text();
        await save(cache, `/students/${encodeURIComponent(sampleStudentId)}`, response.clone());
        await cache.put("/__alfurqan_student_shell__", new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8", "X-Student-Id": sampleStudentId },
        }));
        assetsIn(html).forEach((asset) => assets.add(asset));
      }
    } catch {
      // The student receipt list can be saved on the next download.
    }
  }

  const sampleId = receiptIds.find(Boolean);
  if (sampleId) {
    try {
      const response = await fetch(`/receipts/${encodeURIComponent(sampleId)}`, { credentials: "same-origin", cache: "no-store" });
      if (response.ok) {
        const html = await response.clone().text();
        await save(cache, `/receipts/${encodeURIComponent(sampleId)}`, response.clone());
        await cache.put("/__alfurqan_receipt_shell__", new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8", "X-Receipt-Id": sampleId },
        }));
        assetsIn(html).forEach((asset) => assets.add(asset));
      }
    } catch {
      // The receipt screen can be saved on the next download.
    }
  }

  const discovered = new Set<string>();
  for (const asset of assets) {
    try {
      const response = await fetch(asset, { cache: "no-store" });
      if (!response.ok) continue;
      const type = response.headers.get("content-type") || "";
      const body = type.includes("javascript") ? await response.clone().text() : "";
      await save(cache, asset, response);
      assetsIn(body).forEach((item) => discovered.add(item));
      for (const match of body.matchAll(/static\/chunks\/[^"'\\\s)]+\.js/g)) {
        discovered.add(match[0].startsWith("/") ? match[0] : `/${match[0]}`);
      }
    } catch {
      // Continue with the assets that did download.
    }
  }
  for (const asset of discovered) {
    if (assets.has(asset)) continue;
    try {
      const response = await fetch(asset, { cache: "no-store" });
      await save(cache, asset, response);
    } catch {
      // A single missing chunk is retried the next time the app is saved.
    }
  }
}
