import { NextResponse } from "next/server";
import { authenticateStaff } from "@/lib/data-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, email, password, pin } = body;

    if (mode === "pin") {
      if (!pin || pin.length < 4) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid 4-digit PIN." },
          { status: 400 }
        );
      }
    } else {
      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: "Email and password are required." },
          { status: 400 }
        );
      }
    }

    const user = await authenticateStaff({ mode, email, password, pin });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            mode === "pin"
              ? "Invalid Accountant / Cashier Passcode PIN. Default is 1234."
              : "Invalid email or password. Please check your credentials.",
        },
        { status: 401 }
      );
    }

    // Safe user object (omit password)
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title,
      avatar: user.avatar,
    };

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      message: `Welcome back, ${user.name}!`,
    });

    // Set HTTP session cookie (valid for 7 days)
    response.cookies.set("alfurqan_staff_session", JSON.stringify(safeUser), {
      httpOnly: false, // accessible to client for instant UI state
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Authentication failed." },
      { status: 500 }
    );
  }
}
