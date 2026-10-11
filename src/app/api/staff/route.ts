import { NextResponse } from "next/server";
import { getStaffUsers, createStaffUser, updateStaffUser, deleteStaffUser } from "@/lib/data-store";

export async function GET() {
  try {
    const users = await getStaffUsers();
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (id) {
      // Update existing user
      const updated = await updateStaffUser(id, data);
      return NextResponse.json({ success: true, user: updated });
    } else {
      // Create new user
      if (!data.name || !data.email || !data.pin || !data.role) {
        return NextResponse.json(
          { success: false, error: "Name, email, role, and 4-digit PIN are required." },
          { status: 400 }
        );
      }
      const created = await createStaffUser(data);
      return NextResponse.json({ success: true, user: created });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "User ID is required." }, { status: 400 });
    }

    await deleteStaffUser(id);
    return NextResponse.json({ success: true, message: "Staff user removed successfully." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
