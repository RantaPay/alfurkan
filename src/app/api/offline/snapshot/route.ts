import { getOfflineSnapshot } from "@/server/offline-snapshot";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const snapshot = await getOfflineSnapshot();
    return NextResponse.json({ success: true, snapshot });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to download the accounts copy.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
