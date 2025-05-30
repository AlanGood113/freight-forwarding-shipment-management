import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  // clear cookie
  res.cookies.set("loggedIn", "", { path: "/", maxAge: 0 });
  return res;
}
