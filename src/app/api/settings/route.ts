import { NextResponse } from "next/server";
import { getSchoolProfile, updateSchoolProfile } from "@/lib/data-store";

export async function GET() {
  try {
    const school = await getSchoolProfile();
    return NextResponse.json({ success: true, school });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateSchoolProfile(body);
    return NextResponse.json({ success: true, school: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
