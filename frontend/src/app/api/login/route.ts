import { NextResponse } from "next/server";

const VALID_USER = { username: "admin", password: "AdminPassword123" };

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (username === VALID_USER.username && password === VALID_USER.password) {
    const res = NextResponse.json({ success: true });
    // set a simple cookie (httpOnly by default)
    res.cookies.set("loggedIn", "true", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
    return res;
  }

  return NextResponse.json(
    { success: false, message: "Invalid credentials" },
    { status: 401 }
  );
}
