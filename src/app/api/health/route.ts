import { NextResponse } from "next/server";

/** Connection check only. It does not read or write the database. */
export function GET() {
  return NextResponse.json({ ok: true });
}
