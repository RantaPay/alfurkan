import { NextResponse } from "next/server";
import { getDistinctClassLevels } from "@/lib/data-store";

export async function GET() {
  try {
    const classes = await getDistinctClassLevels();
    return NextResponse.json({ success: true, count: classes.length, classes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
