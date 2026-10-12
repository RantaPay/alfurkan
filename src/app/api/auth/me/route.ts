import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("alfurqan_staff_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ success: false, user: null });
    }

    try {
      const user = JSON.parse(sessionCookie.value);
      return NextResponse.json({ success: true, user });
    } catch {
      return NextResponse.json({ success: false, user: null });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
